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
  if(!isAdmin(req)) return new Response('Unauthorized', { status: 401 })
  const date = todayStr()

  const [{ data: countAll }, { data: sumDeposits }, { data: byStatus }] = await Promise.all([
    supabaseAdmin.from('turns').select('id', { count: 'exact', head: true }).eq('queue_date', date),
    supabaseAdmin.from('turns').select('deposit').eq('queue_date', date).eq('payment_status','paid'),
    supabaseAdmin.rpc('sql', { sql: `
      select status, count(*) as c
      from turns
      where queue_date = '${date}'
      group by status
    ` } as any).then(r=>{
      // fallback si tu proyecto no tiene "sql" RPC habilitado
      if ('error' in r && r.error) return { data: null }
      return r
    })
  ])

  // Fallback si no existe RPC "sql": contamos en app
  let statusCounts: Record<string, number> = {}
  if (!byStatus) {
    const { data: rows } = await supabaseAdmin.from('turns')
      .select('status')
      .eq('queue_date', date)
    rows?.forEach(r => statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1)
  } else {
    byStatus.forEach((r:any) => statusCounts[r.status] = Number(r.c))
  }

  const depositTotal = (sumDeposits || []).reduce((a:any,b:any)=> a + Number(b.deposit||0), 0)

  return Response.json({
    ok:true,
    total_turns: countAll?.length === 0 ? 0 : (countAll as any),
    deposits_sum: Math.round(depositTotal * 100)/100,
    by_status: statusCounts
  })
}

export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'GET,OPTIONS' } }) }
