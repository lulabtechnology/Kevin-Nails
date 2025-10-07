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
  const { data } = await supabaseAdmin.from('queue_state').select('*').eq('queue_date', todayStr()).maybeSingle()
  // Para público, solo exponemos campos neutros
  const resp = data ? { current_number: data.current_number, next_number: data.next_number, is_open: data.is_open } : { current_number:0,next_number:1,is_open:true }
  return Response.json({ data: resp })
}

export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'GET,OPTIONS' } }) }
