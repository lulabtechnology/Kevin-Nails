import { Suspense } from 'react'
import { LoginClient } from './LoginClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="card max-w-sm w-full">Cargando…</div>
      </main>
    }>
      <LoginClient />
    </Suspense>
  )
}
