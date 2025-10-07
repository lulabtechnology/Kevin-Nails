export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  const body = await req.json().catch(()=> ({}))
  const token = String(body?.token || '')
  if(!token || token !== process.env.DASHBOARD_ADMIN_TOKEN){
    return new Response('Unauthorized', { status: 401 })
  }
  // Cookie httpOnly + Secure
  return new Response(JSON.stringify({ ok:true }), {
    headers:{
      'Set-Cookie': `admin_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
      'Content-Type': 'application/json'
    }
  })
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
