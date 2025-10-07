export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(){
  return new Response(JSON.stringify({ ok:true }),{
     headers:{ 'Set-Cookie': 'admin_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' }
  })
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
