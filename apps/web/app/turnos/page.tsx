'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabaseBrowser'
import { todayStr, toMoney } from '@/lib/utils'
import { EstimateChart } from '@/components/EstimateChart'
import { TurnForm, defaultForm, TurnFormData } from '@/components/TurnForm'
import { computePrice } from '@/lib/price'
import { useRouter } from 'next/navigation'
import { Monitor } from '@/components/Monitor'

type Q = { current_number:number, is_open:boolean, next_number:number }

export default function TurnosPage(){
  const supabase = useMemo(() => createBrowserClient(),[])
  const [queue, setQueue] = useState<Q|null>(null)
  const [form, setForm] = useState<TurnFormData>(defaultForm)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errMsg, setErrMsg] = useState<string|undefined>()
  const [infoMsg, setInfoMsg] = useState<string|undefined>()
  const router = useRouter()
  const imageFileRef = useRef<File|null>(null)

  useEffect(() => {
    let active = true
    const sub = supabase
      .channel('queue_state_today_v2')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'queue_state', filter: `queue_date=eq.${todayStr()}` },
        payload => {
          if(!active) return
          const r:any = payload.new
          setQueue({ current_number: r.current_number, is_open: r.is_open, next_number: r.next_number })
        }
      )
      .subscribe()
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

  function validate(): string | undefined {
    if(!form.customer_name.trim()) return 'Nombre es requerido'
    if(!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) return 'Email inválido'
    if(!form.phone.trim()) return 'Teléfono es requerido'
    if(!form.color.trim()) return 'Color es requerido'
    return undefined
  }

  async function handleSubmit(){
    setErrMsg(undefined)
    const v = validate()
    if(v){ setErrMsg(v); return }

    try{
      setCreating(true)
      setInfoMsg('Creando pago (mock)…')

      // 0) Subir imagen (si hay) ANTES del pago solo para tener metadata
      let image_url:string|undefined, image_meta:any
      if(imageFileRef.current){
        setUploading(true)
        const fd = new FormData()
        fd.append('file', imageFileRef.current)
        const up = await fetch('/api/upload', { method:'POST', body: fd })
        if(!up.ok){ throw new Error('Error subiendo imagen') }
        const u = await up.json()
        image_url = u.url
        image_meta = { bucket: u.bucket, path: u.path, score: form.image_score ?? 0 }
        setUploading(false)
      }

      // 1) Crear pago (mock)
      const createPay = await fetch('/api/payments/create', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ provider:'mock', amount: estimate.deposit })
      })
      if(!createPay.ok) throw new Error(await createPay.text())
      const { payment_id } = await createPay.json()
      setInfoMsg('Confirmando pago (mock)…')

      // 2) Confirmar pago (mock)
      const confirm = await fetch('/api/payments/confirm', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ provider:'mock', payment_id, amount: estimate.deposit })
      })
      if(!confirm.ok) throw new Error(await confirm.text())

      // 3) Crear turno (requiere paid)
      setInfoMsg('Asignando número…')
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
        // Fallback solicitado: probar /api/submit (si existiera)
        await fetch('/api/submit',{ method:'POST' }).catch(()=>{})
        throw new Error('Tu navegador intentó GET. Repite: el botón hará POST correctamente.')
      }
      if(!res.ok) throw new Error(await res.text())

      const data = await res.json()
      router.push(`/review/${data.public_id}`)
    }catch(e:any){
      setErrMsg(e?.message || 'Error desconocido')
    }finally{
      setCreating(false); setInfoMsg(undefined)
    }
  }

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Turnos – Hoy</h1>
      <Monitor queue={queue}/>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <TurnForm value={form} onChange={setForm} imageRef={imageFileRef}/>
          <div className="text-xs mt-3 p-3 rounded-xl bg-black/5">
            <b>Políticas:</b> depósito del 15% no reembolsable si no te atiendes hoy.  
            Si se te pasa el número, pasas al final de la fila de hoy (puedes volver a la sala de espera).
          </div>
        </div>
        <div className="card space-y-4">
          <h3 className="font-semibold">Estimado</h3>
          <EstimateChart estimate={estimate}/>
          <div className="space-y-1 text-sm">
            <div>Horas aprox.: <b>{estimate.hours} h</b></div>
            <div>Total estimado: <b>{toMoney(estimate.total)}</b></div>
            <div>Depósito (15%): <b>{toMoney(estimate.deposit)}</b> (mock)</div>
          </div>
          {errMsg && <div className="text-sm text-red-600">{errMsg}</div>}
          {infoMsg && <div className="text-sm text-gray-600">{infoMsg}</div>}
          <button className="btn w-full mt-3 disabled:opacity-60" disabled={creating||uploading} onClick={handleSubmit}>
            {creating ? 'Procesando…' : 'Pagar (mock) y obtener mi número'}
          </button>
        </div>
      </div>
    </main>
  )
}
