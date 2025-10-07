import { TurnFormData } from './types'

export type PriceEstimate = {
  hours: number
  hours_base: number
  hours_add_length_shape: number
  hours_add_art: number
  hours_add_extras: number
  image_score: 0|1|2
  image_multiplier: number
  rate_per_hour: number
  total: number
  deposit: number
}

const RATE = 70 // $/h
const MIN_TOTAL = 20
const DEPOSIT_RATE = 0.15
const MIN_DEPOSIT = 5

const baseHoursByService: Record<TurnFormData['service'], number> = {
  manicure: 0.8,
  pedicure: 1.0,
  acrilico: 1.8,
  gel: 1.2,
  polygel: 1.6,
  presson: 1.0
}

export function computePrice(input: {
  service: TurnFormData['service']
  hand_or_feet: TurnFormData['hand_or_feet']
  length: TurnFormData['length']
  shape: TurnFormData['shape']
  nail_art_level: TurnFormData['nail_art_level']
  nail_art_count: number
  extras: TurnFormData['extras']
  image_score: 0|1|2
}): PriceEstimate {
  const base = baseHoursByService[input.service] ?? 1.0

  const lengthAddMap: Record<TurnFormData['length'], number> = { short: 0, medium: 0.2, long: 0.5, xlong: 0.8 }
  const shapeAddMap: Record<TurnFormData['shape'], number> = { redonda: 0, cuadrada: 0.1, almendra: 0.2, coffin: 0.3, stiletto: 0.4 }
  const hoursLenShape = lengthAddMap[input.length] + shapeAddMap[input.shape]

  const artPerLevel: Record<TurnFormData['nail_art_level'], number> = { none: 0, simple: 0.05, medium: 0.1, advanced: 0.18 }
  const artHours = (artPerLevel[input.nail_art_level] * (input.nail_art_count ?? 0))

  const ex = input.extras || {}
  const extrasHours =
    (ex.retiro ? 0.2 : 0) +
    (ex.refuerzo ? 0.3 : 0) +
    (ex.pedreria ? 0.15 : 0) +
    (ex.encapsulado ? 0.35 : 0) +
    (ex.diseno_por_una ? 0.1 : 0)

  const imgScore:0|1|2 = input.image_score
  const imgMult = 0.8 + imgScore * 0.6 // 0.8, 1.4, 2.0

  const hoursRaw = (base + hoursLenShape + artHours + extrasHours)
  const hours = Math.max(0.5, Math.round(hoursRaw * 2) / 2) // redondeo a 0.5h

  const totalRaw = Math.max(MIN_TOTAL, hours * RATE) * imgMult
  const total = Math.round(totalRaw * 100) / 100
  const depositRaw = Math.max(MIN_DEPOSIT, total * DEPOSIT_RATE)
  const deposit = Math.round(depositRaw * 100) / 100

  return {
    hours,
    hours_base: base,
    hours_add_length_shape: hoursLenShape,
    hours_add_art: artHours,
    hours_add_extras: extrasHours,
    image_score: imgScore,
    image_multiplier: imgMult,
    rate_per_hour: RATE,
    total,
    deposit
  }
}
