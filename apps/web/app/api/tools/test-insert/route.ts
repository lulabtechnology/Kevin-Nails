import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { todayStr } from '@/lib/utils'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(){
  const pid = 'T' + nanoid(8)
  const { data, error } = await supabaseAdmin.from('turns').insert({
    id: crypto.randomUUID(),
    public_id: pid,
    queue_date: todayStr(),
    queue_number: 999,
    customer_name: 'Test User',
    email: 'test@example.com',
    phone: '60000000',
    service: 'gel',
    hand_or_feet: 'hands',
    length: 'medium',
    shape: 'almendra',
    color: 'nude',
    nail_art_level: 'none',
    nail_art_count: 0,
    extras: {},
    price_estimated: 50,
    deposit: 10,
    payment_status: 'paid',
    status: 'waiting'
  }).select().single()
  if(error) return new Response(error.message, { status: 500 })
  return Response.json({ ok:true, data })
}

export async function GET(){ return new Response('Usa POST') }
export async function OPTIONS(){ return new Response(null,{ headers:{ Allow:'POST,GET,OPTIONS' } }) }
