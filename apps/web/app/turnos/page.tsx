'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabaseBrowser'
import { todayStr, toMoney } from '@/lib/utils'
import { computePrice } from '@/lib/price'
import type { TurnFormData } from '@/lib/types'
import { useRouter } from 'next/navigation'

// Cargar componentes de cliente sin SSR (Recharts y File APIs requieren browser)
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

type Q = { current_number: number; is_open: boolean; next_number: number }

export default function TurnosPage() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const router = useRouter()

  const [queue, setQueue] = useState<Q | null>(null)
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
    extras: {
      retiro: false,
      refuerzo: false,
      pedreria: false,
      encapsulado: false,
      diseno_por_una: false,
    },
    image_score: 0,
  }))
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errMsg, setErrMsg] = useState<string | undefined>()
  const [infoMsg, setInfoMsg] = useState<string | undefined>()
  const imageFileRef = useRef<File | null>(null)

  // Suscripción realtime al estado de la cola de HOY
  useEffect(() => {
    let active = true
    const ch = supabase
      .channel('queue_state_today_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_state', filter: `queue_date=eq.${todayStr()}` },
        (payload) => {
          if (!active) return
          const r: any = payload.new
          setQueue({ current_number: r.current_number, is_open: r.is_open, next_number: r.next_number })
        }
      )
      .subscribe()

    // Carga inicial
    fetch('/api/queue/status')
      .then((r) => r.json())
      .then((d) => setQueue(d.data))
      .catch(() => {})

    return () => {
      active = false
      supabase.removeChannel(ch)
    }
  }, [supabase])

  // Estimado (asegurando casteo 0|1|2 para image_score)
  const estimate = useMemo(
    () =>
      computePrice({
        service: form.service,
        hand_or_feet: form.hand_or_feet,
        length: form.length,
        shape: form.shape,
        nail_art_level: form.nail_art_level,
        nail_art_count: form.nail_art_count,
        extras: form.extras,
        image_score: (() => {
          const n = Number(form.image_score ?? 0)
          if (n <= 0) return 0 as 0
          if (n === 1) return 1 as 1
          return 2 as 2
        })(),
      }),
    [form]
  )

  function validate(): string | undefined {
    if (!form.customer_name.trim()) return 'Nombre es requerido'
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) return 'Email inválido'
    if (!form.phone.trim()) return 'Teléfono es requerido'
    if (!form.color.trim()) return 'Color es requerido'
    return undefined
  }

  async function handleSubmit() {
    setErrMsg(undefined)
    const v = validate()
    if (v) {
      setErrMsg(v)
      return
    }

    try {
      setCreating(true)
      setInfoMsg('Creando pago (mock)…')

      // Subida de imagen (opcional)
      let image_url: string | undefined, image_meta: any
      if (imageFileRef.current) {
        setUploading(true)
        const fd = new FormData()
        fd.append('file', imageFileRef.current)
        const up = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!up.ok) throw new Error(await up.text())
        const u = await up.json()
        image_url = u.url
        image_meta = { bucket: u.bucket, path: u.path, score: form.image_score ?? 0 }
        setUploading(false)
      }

      // 1) Crear pago (mock)
      const r1 = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'mock', amount: estimate.deposit }),
      })
      const j1 = await r1.json().catch(async () => ({ ok: false, error: await r1.text() }))
      if (!r1.ok || !j1.ok) throw new Error(j1.error || 'Fallo creando pago')
      const payment_id: string = j1.payment_id

      // 2) Confirmar pago (mock)
      setInfoMsg('Confirmando pago (mock)…')
      const r2 = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'mock', payment_id, amount: estimate.deposit }),
      })
      const j2 = await r2.json().catch(async () => ({ ok: false, error: await r2.text() }))
      if (!r2.ok || !j2.ok) throw new Error(j2.error || 'Fallo confirmando pago')

      // 3) Crear turno (requiere paid)
      setInfoMsg('Asignando número…')
      const r3 = await fetch('/api/turns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'paid',
          payment_id,
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
          image_score: estimate.image_score,
        }),
      })
      const j3 = await r3.json().catch(async () => ({ ok: false, error: await r3.text() }))
      if (!r3.ok || !j3.ok) throw new Error(j3.error || 'Fallo creando turno')

      router.push(`/review/${j3.public_id}`)
    } catch (e: any) {
      setErrMsg(e?.message || 'Error desconocido')
    } finally {
      setCreating(false)
      setInfoMsg(undefined)
    }
  }

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Turnos – Hoy</h1>

      <Monitor queue={queue} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          {/* TurnForm expone el ref para subir imagen y calcula el score */}
          <TurnForm value={form} onChange={setForm} imageRef={imageFileRef} />
          <div className="text-xs mt-3 p-3 rounded-xl bg-black/5">
            <b>Políticas:</b> depósito del 15% no reembolsable si no te atiendes hoy. Si se te pasa el número, pasas al
            final de la fila de hoy.
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold">Estimado</h3>
          <EstimateChart estimate={estimate} />
          <div className="space-y-1 text-sm">
            <div>
              Horas aprox.: <b>{estimate.hours} h</b>
            </div>
            <div>
              Total estimado: <b>{toMoney(estimate.total)}</b>
            </div>
            <div>
              Depósito (15%): <b>{toMoney(estimate.deposit)}</b> (mock)
            </div>
          </div>

          {errMsg && <div className="text-sm text-red-600">{errMsg}</div>}
          {infoMsg && <div className="text-sm text-gray-600">{infoMsg}</div>}

          <button
            type="button"
            className="btn w-full mt-3 disabled:opacity-60"
            disabled={creating || uploading}
            onClick={handleSubmit}
          >
            {creating ? 'Procesando…' : 'Pagar (mock) y obtener mi número'}
          </button>
        </div>
      </div>
    </main>
  )
}
