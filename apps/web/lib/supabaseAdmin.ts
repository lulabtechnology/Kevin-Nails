import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

// No lances excepciones aquí: deja que los endpoints respondan con error legible.
export const supabaseAdmin = url && key
  ? createClient(url, key, {
      auth: { persistSession: false },
      global: { fetch: (...a) => fetch(...a) }
    })
  : (null as any)
