import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(status: number, payload: any) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// GET /api/turns/:public_id
export async function GET(
  _req: Request,
  ctx: { params: { public_id?: string } }
) {
  try {
    if (!supabaseAdmin)
      return json(500, { ok: false, error: 'SUPABASE_URL / SERVICE_ROLE faltan' })

    const pid = String(ctx?.params?.public_id || '').trim()
    if (!pid) return json(400, { ok: false, error: 'public_id requerido' })

    const { data, error } = await supabaseAdmin
      .from('turns')
      .select(
        'public_id, queue_number, queue_date, customer_name, email, phone, service, hand_or_feet, length, shape, color, nail_art_level, nail_art_count, extras, image_url, image_meta, price_estimated, deposit, payment_status, status'
      )
      .eq('public_id', pid)
      .maybeSingle()

    if (error) return json(500, { ok: false, error: error.message })
    if (!data) return json(404, { ok: false, error: 'Turno no encontrado' })

    return json(200, { ok: true, data })
  } catch (e: any) {
    return json(500, { ok: false, error: e?.message || 'Error desconocido' })
  }
}

// Para evitar 405
export async function OPTIONS() {
  return new Response(null, { headers: { Allow: 'GET,OPTIONS' } })
}
