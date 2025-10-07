'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toMoney } from '@/lib/utils'

type Turn = {
  public_id: string
  queue_number: number | null
  queue_date: string
  customer_name: string
  email: string
  phone: string
  service: string
  hand_or_feet: string
  length: string
  shape: string
  color: string
  nail_art_level: string
  nail_art_count: number
  extras: Record<string, boolean>
  image_url?: string | null
  image_meta?: any
  price_estimated: number
  deposit: number
  payment_status: string
  status: string
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [turn, setTurn] = useState<Turn | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`/api/turns/${encodeURIComponent(params.id)}`, { cache: 'no-store' })
        const j = await r.json().catch(async () => ({ ok: false, error: await r.text() }))
        if (!alive) return
        if (!r.ok || !j.ok) {
          setError(j.error || 'No se pudo cargar el turno')
        } else {
          setTurn(j.data as Turn)
        }
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Error desconocido')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [params.id])

  return (
    <main className="px-4 py-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Ficha del turno</h1>

      {loading && <div className="card">Cargando…</div>}

      {error && (
        <div className="card text-red-600">
          <div className="font-semibold mb-1">Error</div>
          <div className="text-sm">{error}</div>
          <div className="mt-3">
            <Link href="/turnos" className="btn">Volver a Turnos</Link>
          </div>
        </div>
      )}

      {turn && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Tu número</div>
              <div className="text-3xl font-bold">{turn.queue_number ?? '—'}</div>
              <div className="text-xs text-gray-500">Fecha: {turn.queue_date}</div>
            </div>
            <div className="text-right">
              <div className="text-sm">Estimado total</div>
              <div className="text-xl font-semibold">{toMoney(turn.price_estimated)}</div>
              <div className="text-xs text-gray-500">Depósito: {toMoney(turn.deposit)} ({turn.payment_status})</div>
            </div>
          </div>

          {turn.image_url && (
            <div className="rounded-xl overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={turn.image_url} alt="Referencia" className="w-full h-60 object-cover" />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-black/5 rounded-xl">
              <div className="font-semibold mb-1">Cliente</div>
              <div>{turn.customer_name}</div>
              <div className="text-gray-600">{turn.phone}</div>
              <div className="text-gray-600">{turn.email}</div>
            </div>
            <div className="p-3 bg-black/5 rounded-xl">
              <div className="font-semibold mb-1">Servicio</div>
              <div>{turn.service} · {turn.hand_or_feet}</div>
              <div>{turn.length} · {turn.shape} · {turn.color}</div>
              <div>Arte: {turn.nail_art_level} ({turn.nail_art_count})</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/turnos" className="btn">Volver</Link>
            <Link href="/" className="btn">Inicio</Link>
          </div>
        </div>
      )}
    </main>
  )
}
