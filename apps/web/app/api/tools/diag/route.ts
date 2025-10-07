import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { todayStr } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAdmin(req:Request){
  const h = req.headers.get('authorization') || ''
  const tok = h.replace(/^Bearer\s+/i,'').trim()
  return tok && tok === process.env.DASHBOARD_ADMIN_TOKEN
}

export async function GET(req:Request){
  // listado de turnos de hoy (solo admin)
  if(!isAdmin(req)) return new Response('Unauthorized', { status: 401 })
  const { data: turns } = await supabaseAdmin
    .from('turns')
    .select('public_id,queue_number,customer_name,status,price_estimated,created_at')
    .eq('queue_date', todayStr())
    .order('queue_number', { ascending: true })
  return Response.json({ ok:true, turns })
}

export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'GET,OPTIONS' } }) }
