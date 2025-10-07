export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  const ok = {
    has_service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    has_public: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    site: process.env.NEXT_PUBLIC_SITE_URL || 'NO_SITE',
    bucket: 'nail-refs'
  }
  return Response.json({ ok })
}

export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'GET,OPTIONS' } }) }
