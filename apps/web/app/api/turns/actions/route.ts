import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { todayStr } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAdmin(req:Request){
  const h = req.headers.get('authorization') || ''
  const tok = h.replace(/^Bearer\s+/i,'').trim()
  return tok && tok === process.env.DASHBOARD_ADMIN_TOKEN
}

export async function POST(req:Request){
  if(!isAdmin(req)) return new Response('Unauthorized', { status: 401 })
  const body = await req.json().catch(()=> ({}))
  const action = String(body?.action || '')
  const public_id = String(body?.public_id || '')
  if(!public_id) return new Response('public_id requerido', { status: 400 })

  if(action === 'done' || action === 'no_show'){
    const { error } = await supabaseAdmin.from('turns')
      .update({ status: action })
      .eq('public_id', public_id)
      .eq('queue_date', todayStr())
    if(error) return new Response(error.message, { status: 500 })
    return Response.json({ ok:true, action })
  }

  if(action === 'send_to_end'){
    const { data, error } = await supabaseAdmin.rpc('fn_send_to_end', { p_public_id: public_id, p_date: todayStr() })
    if(error) return new Response(error.message, { status: 500 })
    return Response.json({ ok:true, new_number: data })
  }

  return new Response('Acción inválida', { status: 400 })
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
