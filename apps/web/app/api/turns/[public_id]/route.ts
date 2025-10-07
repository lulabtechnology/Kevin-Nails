import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_:Request, { params }:{ params:{ public_id:string } }){
  const { data: turn, error } = await supabaseAdmin.from('turns').select('*').eq('public_id', params.public_id).maybeSingle()
  if(error || !turn) return new Response('Not found', { status: 404 })
  return Response.json({ turn })
}

export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'GET,OPTIONS' } }) }
