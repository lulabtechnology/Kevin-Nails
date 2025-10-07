import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createTurnSchema } from '@/lib/validation'
import { todayStr } from '@/lib/utils'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  // 1) Validación (aceptamos props extra por .passthrough en el schema)
  const parsed = createTurnSchema.safeParse(body)
  if (!parsed.success) {
    // No reclamamos número si falla validación
    return new Response(`Validación: ${parsed.error.message}`, { status: 400 })
  }
  const v = parsed.data
  const payment_id: string | undefined = v.payment_id
  const pDate = todayStr()

  // 2) Reclamar número atómicamente
  const claim = await supabaseAdmin.rpc('fn_claim_next_turn', { p_date: pDate })
  if (claim.error) {
    return new Response(`Claim error: ${claim.error.message}`, { status: 500 })
  }
  const claimed: number = claim.data

  // 3) Intentar insertar el turno
  const public_id = 'T' + nanoid(10)
  try {
    const { error: e2 } = await supabaseAdmin.from('turns').insert({
      id: crypto.randomUUID(),
      public_id,
      queue_date: pDate,
      queue_number: claimed,
      customer_name: v.customer_name,
      email: v.email,
      phone: v.phone,
      service: v.service,
      hand_or_feet: v.hand_or_feet,
      length: v.length,
      shape: v.shape,
      color: v.color,
      nail_art_level: v.nail_art_level,
      nail_art_count: v.nail_art_count,
      extras: v.extras ?? {},
      image_url: v.image_url,
      image_meta: v.image_meta,
      price_estimated: v.price_estimated,
      deposit: v.deposit,
      payment_status: v.payment_status ?? 'unpaid',
      status: 'waiting'
    })
    if (e2) throw e2

    // 4) Enlazar el pago mock si vino payment_id
    if (payment_id) {
      await supabaseAdmin
        .from('payments')
        .update({ turn_public_id: public_id })
        .contains('raw', { ext_id: payment_id })
    }

    return Response.json({ ok: true, public_id, queue_number: claimed })
  } catch (err: any) {
    // 5) IMPORTANTE: revertir el claim si no se insertó el turno
    try {
      await supabaseAdmin.rpc('fn_unclaim_last', { p_date: pDate, p_claimed: claimed })
    } catch { /* silencioso */ }

    const msg = typeof err?.message === 'string' ? err.message : 'Error desconocido insertando turno'
    return new Response(`Insert error: ${msg}`, { status: 500 })
  }
}

export async function GET() { return new Response('Usa POST') }
export async function OPTIONS() { return new Response(null, { headers: { Allow: 'POST,GET,OPTIONS' } }) }
