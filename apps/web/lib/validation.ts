import { z } from 'zod'

export const createTurnSchema = z.object({
  payment_status: z.enum(['paid','unpaid']).default('unpaid'),
  payment_id: z.string().optional(),

  customer_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(3),

  service: z.enum(['manicure','pedicure','acrilico','gel','polygel','presson']),
  hand_or_feet: z.enum(['hands','feet']),
  length: z.enum(['short','medium','long','xlong']),
  shape: z.enum(['redonda','cuadrada','almendra','coffin','stiletto']),
  color: z.string().min(1),

  nail_art_level: z.enum(['none','simple','medium','advanced']),
  nail_art_count: z.number().int().min(0),

  extras: z.record(z.boolean()).default({}),

  image_url: z.string().url().optional(),
  image_meta: z.any().optional(),

  price_estimated: z.number().min(0),
  deposit: z.number().min(0),

  image_score: z.number().min(0).max(2).optional()
}).passthrough()

export type CreateTurnInput = z.infer<typeof createTurnSchema>
