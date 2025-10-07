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
  const date = todayStr()

  // Total de turnos hoy (count exact, head:true)
  const { count: totalTurns, error: eCount } = await supabaseAdmin
    .from('turns')
    .select('*', { count: 'exact', head: true })
    .eq('queue_date', date)
  if (eCount) return new Response(eCount.message, { status: 500 })

  // Suma de depósitos pagados hoy
  const { data: paidRows, error: eDep } = await supabaseAdmin
    .from('turns')
    .select('deposit')
    .eq('queue_date', date)
    .eq('payment_status','paid')
  if (eDep) return new Response(eDep.message, { status: 500 })
  const deposits_sum = Math.round((paidRows ?? []).reduce((a,r)=> a + Number(r.deposit||0), 0) * 100) / 100

  // Conteo por estado
  const { data: statusRows, error: eStatus } = await supabaseAdmin
    .from('turns')
    .select('status')
    .eq('queue_date', date)
  if (eStatus) return new Response(eStatus.message, { status: 500 })
  const by_status: Record<string, number> = {}
  ;(statusRows ?? []).forEach(r => {
    by_status[r.status] = (by_status[r.status] ?? 0) + 1
  })

  return Response.json({
    ok: true,
    total_turns: totalTurns ?? 0,
    deposits_sum,
    by_status
  })
}

export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'GET,OPTIONS' } }) }
