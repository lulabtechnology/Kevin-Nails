'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function Probe(){
  const [log, setLog] = useState<string>('Listo. Pulsa los botones.')
  async function call(path: string, body?: any){
    setLog(`Llamando ${path}…`)
    try{
      const r = await fetch(path, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body ?? {}) })
      const txt = await r.text()
      setLog(`${path} -> ${r.status}\n${txt}`)
    }catch(e:any){
      setLog(`${path} -> EXCEPTION\n${e?.message || e}`)
    }
  }
  return (
    <main className="p-6 space-y-3 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold">Probe</h1>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn" onClick={()=>call('/api/tools/ping')}>/api/tools/ping</button>
        <button className="btn" onClick={()=>call('/api/payments/create', { provider:'mock', amount: 12.34 })}>payments/create</button>
        <button className="btn" onClick={()=>call('/api/payments/confirm', { provider:'mock', payment_id:'PMOCK_TEST', amount: 12.34 })}>payments/confirm</button>
        <button className="btn" onClick={()=>call('/api/turns/create', {
          payment_status:'paid',
          payment_id:'PMOCK_TEST',
          customer_name:'Ana',
          email:'ana@example.com',
          phone:'6000-0000',
          service:'gel',
          hand_or_feet:'hands',
          length:'medium',
          shape:'almendra',
          color:'nude',
          nail_art_level:'simple',
          nail_art_count:2,
          extras:{},
          price_estimated: 80,
          deposit: 12,
        })}>turns/create (mock)</button>
      </div>
      <pre className="p-3 rounded-xl bg-black/5 text-xs whitespace-pre-wrap">{log}</pre>
    </main>
  )
}
