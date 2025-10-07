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
  if(!isAdmin(req)) return new Response('Unauthorized', { status:401 })
  const { data, error } = await supabaseAdmin.rpc('fn_advance_current', { p_date: todayStr(), step: 1 })
  if(error) return new Response(error.message, { status:500 })
  return Response.json({ ok:true, current: data })
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
