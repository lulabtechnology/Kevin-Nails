import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (status:number, payload:any) =>
  new Response(JSON.stringify(payload), { status, headers:{ 'Content-Type':'application/json' } })

export async function POST(req: Request) {
  try{
    const body = await req.json().catch(() => ({}))
    const payment_id = String(body?.payment_id || '')
    const provider = String(body?.provider || 'mock')
    const amount = Number(body?.amount || 0)

    if (!payment_id) return json(400, { ok:false, error:'payment_id requerido' })
    if (!amount || amount <= 0) return json(400, { ok:false, error:'amount inválido' })

    if (!supabaseAdmin) {
      return json(200, { ok:true, payment_id, status:'succeeded', note:'admin client not configured' })
    }

    const upd = await supabaseAdmin.from('payments').update({
      status: 'succeeded',
      raw: { ...(body?.raw ?? {}), ext_id: payment_id, confirmed_at: new Date().toISOString() }
    })
      .eq('provider', provider)
      .eq('amount', amount)
      .contains('raw', { ext_id: payment_id })

    if (upd.error) return json(500, { ok:false, error: upd.error.message })
    return json(200, { ok: true, payment_id, status: 'succeeded' })
  }catch(e:any){
    return json(500, { ok:false, error: e?.message || 'Error desconocido en confirm payment' })
  }
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
