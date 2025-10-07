'use client'
import { useEffect, useState } from 'react'
import { toMoney } from '@/lib/utils'

type Turn = {
  public_id:string, queue_number:number, customer_name:string,
  status:string, price_estimated:number, created_at:string
}

export default function Dashboard(){
  const [admin, setAdmin] = useState<string|undefined>()
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<any>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [metrics, setMetrics] = useState<{deposits_sum:number, by_status:Record<string,number>, total_turns:number} | null>(null)
  const [busyId, setBusyId] = useState<string|null>(null)

  async function load(){
    setLoading(true)
    const token = localStorage.getItem('ADMIN_TOKEN') ?? ''
    setAdmin(token)
    const h = { 'Authorization': `Bearer ${token}` }

    const [sRes,tRes,mRes] = await Promise.all([
      fetch('/api/queue/status', { headers: h }),
      fetch('/api/tools/diag', { headers: h }),
      fetch('/api/tools/metrics', { headers: h })
    ])
    const s = await sRes.json()
    const d = await tRes.json()
    const m = mRes.ok ? await mRes.json(): null
    setState(s.data)
    setTurns(d.turns ?? [])
    setMetrics(m)
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function advance(){
    if(!admin) return alert('No autorizado')
    const r = await fetch('/api/queue/advance', { method:'POST', headers:{ 'Authorization': `Bearer ${admin}` } })
    if(!r.ok){ alert('Error avanzando'); return }
    await load()
  }

  async function action(public_id:string, act:'done'|'no_show'|'send_to_end'){
    if(!admin) return alert('No autorizado')
    setBusyId(public_id)
    const r = await fetch('/api/turns/actions', {
      method:'POST',
      headers:{ 'Authorization': `Bearer ${admin}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ action: act, public_id })
    })
    if(!r.ok){ alert('Error: ' + await r.text()); setBusyId(null); return }
    await load()
    setBusyId(null)
  }

  if(loading) return <main className="p-6">Cargando…</main>

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <a href="/(auth)/login" className="underline text-sm">Cambiar token</a>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm opacity-70">Número actual</div>
          <div className="text-3xl font-bold">{state?.current_number ?? 0}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">Siguiente número</div>
          <div className="text-3xl font-bold">{state?.next_number ?? 1}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">Turnos hoy</div>
          <div className="text-3xl font-bold">{metrics?.total_turns ?? 0}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">Depósitos (mock) hoy</div>
          <div className="text-3xl font-bold">{toMoney(metrics?.deposits_sum ?? 0)}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold mb-3">Turnos de hoy</h3>
          <button className="btn" onClick={advance}>Avanzar +1</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">#</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Creado</th>
                <th className="p-2">Estimado</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turns.map(t=>(
                <tr key={t.public_id} className="border-t">
                  <td className="p-2">{t.queue_number}</td>
                  <td className="p-2">{t.customer_name}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2">{new Date(t.created_at).toLocaleTimeString()}</td>
                  <td className="p-2">{toMoney(t.price_estimated)}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button className="btn" disabled={busyId===t.public_id} onClick={()=>action(t.public_id,'done')}>Done</button>
                      <button className="btn" disabled={busyId===t.public_id} onClick={()=>action(t.public_id,'no_show')}>No show</button>
                      <button className="btn" disabled={busyId===t.public_id} onClick={()=>action(t.public_id,'send_to_end')}>Al final</button>
                    </div>
                  </td>
                </tr>
              ))}
              {turns.length===0 && (
                <tr><td className="p-2" colSpan={6}>Sin turnos hoy.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs opacity-70">
        <b>Políticas visibles:</b> depósito no reembolsable si no te atiendes hoy; si se pasa el número, se envía al final de la fila del día.
      </div>
    </main>
  )
}
