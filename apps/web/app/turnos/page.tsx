'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabaseBrowser'
import { todayStr, toMoney } from '@/lib/utils'
import { EstimateChart } from '@/components/EstimateChart'
import { TurnForm, defaultForm, TurnFormData } from '@/components/TurnForm'
import { computePrice } from '@/lib/price'
import { useRouter } from 'next/navigation'
import { Monitor } from '@/components/Monitor'

export default function TurnosPage(){
  const supabase = useMemo(() => createBrowserClient(),[])
  const [queue, setQueue] = useState<{current_number:number,is_open:boolean,next_number:number}|null>(null)
  const [form, setForm] = useState<TurnFormData>(defaultForm)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const imageFileRef = useRef<File|null>(null)

  // Realtime monitor de queue_state (fila de HOY)
  useEffect(() => {
    let active = true
    const sub = supabase
      .channel('queue_state_today')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'queue_state', filter: `queue_date=eq.${todayStr()}` },
        payload => {
          if(!active) return
          const r:any = payload.new
          setQueue({ current_number: r.current_number, is_open: r.is_open, next_number: r.next_number })
        }
      )
      .subscribe()

    // primera carga
    fetch('/api/queue/status').then(r=>r.json()).then(d=>setQueue(d.data)).catch(()=>{})

    return () => { active=false; supabase.removeChannel(sub) }
  }, [supabase])

  const estimate = useMemo(()=>computePrice({
    service: form.service,
    hand_or_feet: form.hand_or_feet,
    length: form.length,
    shape: form.shape,
    nail_art_level: form.nail_art_level,
    nail_art_count: form.nail_art_count,
    extras: form.extras,
    image_score: (():0|1|2=>{
      const n = Number(form.image_score ?? 0)
      if(n<=0) return 0
      if(n===1) return 1
      return 2
    })()
  }), [form])

  async function handleSubmit(){
    try{
      setCreating(true)
      // 1) pago mock local (FASE 1): simplemente asumimos success
      const payment = { ok:true, provider:'mock', amount: estimate.deposit, status:'succeeded' }

      // 2) subir imagen (si hay)
      let image_url:string|undefined, image_meta:any
      if(imageFileRef.current){
        setUploading(true)
        const fd = new FormData()
        fd.append('file', imageFileRef.current)
        const up = await fetch('/api/upload', { method:'POST', body: fd })
        if(!up.ok){ alert('Error subiendo imagen'); setUploading(false); setCreating(false); return }
        const u = await up.json()
        setUploading(false)
        image_url = u.url
        image_meta = { bucket: u.bucket, path: u.path, score: form.image_score ?? 0 }
      }

      // 3) crear turno (requiere payment_status='paid')
      const res = await fetch('/api/turns/create',{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          payment_status: 'paid',
          customer_name: form.customer_name,
          email: form.email,
          phone: form.phone,
          service: form.service,
          hand_or_feet: form.hand_or_feet,
          length: form.length,
          shape: form.shape,
          color: form.color,
          nail_art_level: form.nail_art_level,
          nail_art_count: form.nail_art_count,
          extras: form.extras,
          image_url,
          image_meta,
          price_estimated: estimate.total,
          deposit: estimate.deposit,
          image_score: estimate.image_score
        })
      })
      if(res.status===405){
        alert('Usa POST')
        setCreating(false); return
      }
      if(!res.ok){
        const t = await res.text()
        alert('Error creando turno: '+t)
        setCreating(false); return
      }
      const data = await res.json()
      router.push(`/review/${data.public_id}`)
    }catch(e:any){
      alert('Error: '+e?.message ?? 'desconocido')
    }finally{
      setCreating(false)
    }
  }

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Turnos – Hoy</h1>
      <Monitor queue={queue}/>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <TurnForm value={form} onChange={setForm} imageRef={imageFileRef}/>
        </div>
        <div className="card space-y-4">
          <h3 className="font-semibold">Estimado</h3>
          <EstimateChart estimate={estimate}/>
          <div className="space-y-1 text-sm">
            <div>Horas aprox.: <b>{estimate.hours} h</b></div>
            <div>Total estimado: <b>{toMoney(estimate.total)}</b></div>
            <div>Depósito (15%): <b>{toMoney(estimate.deposit)}</b> (mock)</div>
          </div>
          <button className="btn w-full mt-3" disabled={creating||uploading} onClick={handleSubmit}>
            {creating ? 'Creando turno…' : 'Pagar (mock) y obtener mi número'}
          </button>
        </div>
      </div>
    </main>
  )
}
