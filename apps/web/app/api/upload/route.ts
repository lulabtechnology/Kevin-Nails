import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req:Request){
  const form = await req.formData()
  const file = form.get('file') as File | null
  if(!file) return new Response('Archivo requerido', { status: 400 })
  const ext = (file.name.split('.').pop()||'jpg').toLowerCase()
  const id = nanoid(12)
  const path = `refs/${id}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error } = await supabaseAdmin.storage.from('nail-refs').upload(path, buf, { contentType: file.type, upsert: false })
  if(error) return new Response(error.message, { status: 500 })
  const { data:pub } = supabaseAdmin.storage.from('nail-refs').getPublicUrl(path)
  return Response.json({ ok:true, bucket:'nail-refs', path, url: pub.publicUrl })
}
export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
