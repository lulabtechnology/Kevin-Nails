import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const provider = (body?.provider ?? 'mock') as string
  const amount = Number(body?.amount ?? 0)
  if (!amount || amount <= 0) return new Response('Monto inválido', { status: 400 })

  const ext_id = 'PMOCK_' + nanoid(10)
  const { error } = await supabaseAdmin.from('payments').insert({
    id: crypto.randomUUID(),
    turn_public_id: body?.turn_public_id ?? null,
    provider,
    amount,
    status: 'requires_confirmation',
    raw: { ext_id, created_at: new Date().toISOString() }
  })
  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ ok: true, payment_id: ext_id, provider, amount, status: 'requires_confirmation' })
}

export async function GET() { return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
