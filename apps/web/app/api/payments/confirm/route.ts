import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const payment_id = String(body?.payment_id || '')
  const provider = String(body?.provider || 'mock')
  const amount = Number(body?.amount || 0)

  if (!payment_id) return new Response('payment_id requerido', { status: 400 })

  const { error } = await supabaseAdmin.from('payments').update({
    status: 'succeeded',
    raw: { ...(body?.raw ?? {}), ext_id: payment_id, confirmed_at: new Date().toISOString() }
  }).eq('provider', provider).eq('amount', amount).contains('raw', { ext_id: payment_id })

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ ok: true, payment_id, status: 'succeeded' })
}

export async function GET() { return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
