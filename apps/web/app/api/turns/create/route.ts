import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createTurnSchema } from '@/lib/validation'
import { todayStr } from '@/lib/utils'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(status:number, payload:any){
  return new Response(JSON.stringify(payload), { status, headers:{ 'Content-Type':'application/json' } })
}

export async function POST(req: Request) {
  try{
    const body = await req.json().catch(() => ({}))

    const parsed = createTurnSchema.safeParse(body)
    if (!parsed.success) {
      return json(400, { ok:false, error:`Validación: ${parsed.error.message}` })
    }
    const v = parsed.data
    const payment_id: string | undefined = v.payment_id
    const pDate = todayStr()

    // 1) Reclamar número
    const claim = await supabaseAdmin.rpc('fn_claim_next_turn', { p_date: pDate })
    if (claim.error) return json(500, { ok:false, error:`Claim error: ${claim.error.message}` })
    const claimed: number = claim.data

    // 2) Insertar turno
    const public_id = 'T' + nanoid(10)
    const ins = await supabaseAdmin.from('turns').insert({
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

    if (ins.error) {
      // 3) Rollback del claim SIN usar .catch()
      try {
        await supabaseAdmin.rpc('fn_unclaim_last', { p_date: pDate, p_claimed: claimed })
      } catch (_) { /* ignorar */ }
      return json(500, { ok:false, error:`Insert error: ${ins.error.message}` })
    }

    // 4) Enlazar pago mock si vino payment_id
    if (payment_id) {
      await supabaseAdmin
        .from('payments')
        .update({ turn_public_id: public_id })
        .contains('raw', { ext_id: payment_id })
    }

    return json(200, { ok:true, public_id, queue_number: claimed })
  }catch(e:any){
    return json(500, { ok:false, error: e?.message || 'Error desconocido en create turn' })
  }
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
