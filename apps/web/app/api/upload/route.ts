import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { randomUUID } from 'crypto'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if(!file) return new Response('file requerido', { status: 400 })

  const ext = (file.name.split('.').pop() || 'webp').toLowerCase()
  const key = `refs/${nanoid(10)}-${randomUUID()}.${ext}`

  const array = await file.arrayBuffer()
  const { data, error } = await supabaseAdmin.storage
    .from('nail-refs')
    .upload(key, Buffer.from(array), {
      contentType: file.type || 'application/octet-stream',
      upsert: false
    })

  if (error) return new Response(error.message, { status: 500 })

  const { data: pub } = supabaseAdmin.storage.from('nail-refs').getPublicUrl(key)
  return Response.json({ ok:true, bucket:'nail-refs', path:key, url: pub.publicUrl })
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
