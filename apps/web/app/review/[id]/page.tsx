import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getData(id:string){
  const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/turns/${id}`, { cache:'no-store' })
  if(!r.ok) return null
  return r.json()
}

export default async function ReviewPage({ params }:{ params:{ id:string } }){
  const data = await getData(params.id)
  if(!data) return notFound()
  const t = data.turn
  return (
    <main className="px-4 py-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Tu turno</h1>
      <div className="card space-y-2">
        <div><b>Número:</b> {t.queue_number}</div>
        <div><b>Cliente:</b> {t.customer_name}</div>
        <div><b>Servicio:</b> {t.service}</div>
        <div><b>Color:</b> {t.color}</div>
        <div><b>Estimado:</b> ${t.price_estimated}</div>
        <div><b>Depósito:</b> ${t.deposit}</div>
        <div className="text-sm opacity-70">Política: si pierdes el número, pasas al final de la fila de hoy. Depósito 15% no reembolsable si no asistes hoy.</div>
      </div>
    </main>
  )
}
