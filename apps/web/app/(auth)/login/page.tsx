'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage(){
  const [t, setT] = useState('')
  const [err, setErr] = useState<string|undefined>()
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/dashboard'

  async function submit(){
    setErr(undefined)
    const r = await fetch('/api/auth/login', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ token: t })
    })
    if(!r.ok){ setErr(await r.text()); return }
    router.replace(next)
  }

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="card max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold">Login dueño</h1>
        <input className="w-full border rounded-xl p-2" placeholder="Token admin"
               value={t} onChange={e=>setT(e.target.value)} />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn w-full" onClick={submit}>Entrar</button>
      </div>
    </main>
  )
}
