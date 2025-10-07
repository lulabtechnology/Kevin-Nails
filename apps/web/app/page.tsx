import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <section className="card max-w-3xl w-full text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Image src="/kevin-logo.png" alt="KEVIN NAILS STUDIO" width={80} height={80}/>
          <h1 className="text-2xl font-semibold">KEVIN NAILS STUDIO</h1>
        </div>
        <p>Turnos en tiempo real. Reserva tu número y asegúralo con depósito (mock).</p>
        <div className="flex gap-3 justify-center">
          <Link href="/turnos" className="btn">Tomar turno ahora</Link>
          <Link href="/dashboard" className="btn">Dashboard</Link>
        </div>
      </section>
    </main>
  )
}
