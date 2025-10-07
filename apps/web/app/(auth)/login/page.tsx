'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage(){
  const [t, setT] = useState('')
  const router = useRouter()
  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="card max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold">Login dueño</h1>
        <input className="w-full border rounded-xl p-2" placeholder="Token admin"
               value={t} onChange={e=>setT(e.target.value)} />
        <button className="btn w-full" onClick={()=>{
          localStorage.setItem('ADMIN_TOKEN', t)
          router.push('/dashboard')
        }}>Entrar</button>
      </div>
    </main>
  )
}
