import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { todayStr } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAdmin(req: Request){
  const cookie = req.headers.get('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/)
  const tokCookie = m?.[1] ? decodeURIComponent(m[1]) : ''
  if (tokCookie && tokCookie === process.env.DASHBOARD_ADMIN_TOKEN) return true
  const h = req.headers.get('authorization') || ''
  const tokHeader = h.replace(/^Bearer\s+/i,'').trim()
  return !!tokHeader && tokHeader === process.env.DASHBOARD_ADMIN_TOKEN
}

export async function GET(req:Request){
  if(!isAdmin(req)) return new Response('Unauthorized', { status: 401 })
  const { data: turns, error } = await supabaseAdmin
    .from('turns')
    .select('public_id,queue_number,customer_name,status,price_estimated,created_at')
    .eq('queue_date', todayStr())
    .order('queue_number', { ascending: true })
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ ok:true, turns })
}

export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'GET,OPTIONS' } }) }
