import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createTurnSchema } from '@/lib/validation'
import { todayStr } from '@/lib/utils'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req:Request){
  const body = await req.json().catch(()=> ({}))

  // Validar permitiendo props extra (schema .passthrough)
  const parsed = createTurnSchema.safeParse(body)
  if(!parsed.success){
    // No reclamamos número si falla validación
    return new Response(parsed.error.message, { status: 400 })
  }
  const v = parsed.data
  const payment_id: string | undefined = v.payment_id

  // 1) reclamar número atómicamente
  const { data: claimed, error: e1 } = await supabaseAdmin.rpc('fn_claim_next_turn', { p_date: todayStr() })
  if(e1) return new Response(e1.message, { status: 500 })

  // 2) insertar turno
  const public_id = 'T' + nanoid(10)
  const { error: e2 } = await supabaseAdmin.from('turns').insert({
    id: crypto.randomUUID(),
    public_id,
    queue_date: todayStr(),
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
  if(e2){
    // IMPORTANTE: si algo falla aquí, ya consumimos next_number.
    // Regresamos error claro para el cliente.
    return new Response(e2.message, { status: 500 })
  }

  // 3) si tenemos payment_id (mock), enlazar pago a este turno
  if (payment_id) {
    await supabaseAdmin
      .from('payments')
      .update({ turn_public_id: public_id })
      .contains('raw', { ext_id: payment_id })
  }

  return Response.json({ ok:true, public_id, queue_number: claimed })
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
