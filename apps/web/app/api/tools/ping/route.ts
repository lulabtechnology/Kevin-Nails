export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(){ 
  return Response.json({ ok:true, ts: Date.now() })
}
export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
