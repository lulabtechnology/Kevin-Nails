'use client'
import { useEffect, useMemo, useState } from 'react'
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

  async function load(){
    setLoading(true)
    const token = localStorage.getItem('ADMIN_TOKEN') ?? ''
    setAdmin(token)
    const h = { 'Authorization': `Bearer ${token}` }
    const [sRes,tRes] = await Promise.all([
      fetch('/api/queue/status', { headers: h }),
      fetch('/api/tools/diag', { headers: h })
    ])
    const s = await sRes.json()
    const d = await tRes.json()
    setState(s.data)
    setTurns(d.turns ?? [])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function advance(){
    if(!admin) return alert('No autorizado')
    const r = await fetch('/api/queue/advance', { method:'POST', headers:{ 'Authorization': `Bearer ${admin}` } })
    if(!r.ok){ alert('Error avanzando'); return }
    await load()
  }

  if(loading) return <main className="p-6">Cargando…</main>

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <a href="/(auth)/login" className="underline text-sm">Cambiar token</a>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm opacity-70">Número actual</div>
          <div className="text-3xl font-bold">{state?.current_number ?? 0}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">Siguiente número</div>
          <div className="text-3xl font-bold">{state?.next_number ?? 1}</div>
        </div>
        <div className="card">
          <button className="btn w-full" onClick={advance}>Avanzar +1</button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Turnos de hoy</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">#</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Creado</th>
                <th className="p-2">Estimado</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
