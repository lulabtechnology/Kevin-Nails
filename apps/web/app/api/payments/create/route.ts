import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(status:number, payload:any){
  return new Response(JSON.stringify(payload), { status, headers:{ 'Content-Type':'application/json' } })
}

export async function POST(req: Request) {
  try{
    const body = await req.json().catch(() => ({}))
    const provider = String(body?.provider ?? 'mock')
    const amount = Number(body?.amount ?? 0)
    if (!amount || amount <= 0) return json(400, { ok:false, error:'Monto inválido' })

    const ext_id = 'PMOCK_' + nanoid(10)
    const { error } = await supabaseAdmin.from('payments').insert({
      id: crypto.randomUUID(),
      turn_public_id: null,
      provider,
      amount,
      status: 'requires_confirmation',
      raw: { ext_id, created_at: new Date().toISOString() }
    })
    if (error) return json(500, { ok:false, error: error.message })

    return json(200, { ok: true, payment_id: ext_id, provider, amount, status: 'requires_confirmation' })
  }catch(e:any){
    return json(500, { ok:false, error: e?.message || 'Error desconocido en create payment' })
  }
}

export async function GET() { return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
