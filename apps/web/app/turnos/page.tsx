'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabaseBrowser'
import { todayStr, toMoney } from '@/lib/utils'
import { computePrice } from '@/lib/price'
import { useRouter } from 'next/navigation'

// Cargar componentes de cliente sin SSR (Recharts necesita browser)
const EstimateChart = dynamic(
  () => import('@/components/EstimateChart').then(m => m.EstimateChart),
  { ssr: false }
)
const TurnForm = dynamic(
  () => import('@/components/TurnForm').then(m => m.TurnForm),
  { ssr: false }
)
const Monitor = dynamic(
  () => import('@/components/Monitor').then(m => m.Monitor),
  { ssr: false }
)

type Q = { current_number:number, is_open:boolean, next_number:number }
type TurnFormData = import('@/components/TurnForm').TurnFormData

export default function TurnosPage(){
  const supabase = useMemo(() => createBrowserClient(),[])
  const [queue, setQueue] = useState<Q|null>(null)
  const [form, setForm] = useState<TurnFormData>(() => ({
    customer_name: 'Ana Cliente',
    email: 'ana@example.com',
    phone: '6000-0000',
    service: 'gel',
    hand_or_feet: 'hands',
    length: 'medium',
    shape: 'almendra',
    color: 'nude',
    nail_art_level: 'simple',
    nail_art_count: 2,
    extras: { retiro:false, refuerzo:false, pedreria:false, encapsulado:false, diseno_por_una:false },
    image_score: 0
  }))
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errMsg, setErrMsg] = useState<string|undefined>()
  const [infoMsg, setInfoMsg] = useState<string|undefined>()
  const router = useRouter()
  const imageFileRef = useRef<File|null>(null)

  useEffect(() => {
    let active = true
    const ch = supabase
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
    return () => { active=false; supabase.removeChannel(ch) }
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

      // Subida de imagen (opcional)
      let image_url:string|u_
