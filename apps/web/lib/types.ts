export type TurnFormData = {
  customer_name: string
  email: string
  phone: string
  service: 'manicure'|'pedicure'|'acrilico'|'gel'|'polygel'|'presson'
  hand_or_feet: 'hands'|'feet'
  length: 'short'|'medium'|'long'|'xlong'
  shape: 'redonda'|'cuadrada'|'almendra'|'coffin'|'stiletto'
  color: string
  nail_art_level: 'none'|'simple'|'medium'|'advanced'
  nail_art_count: number
  extras: Partial<{ retiro:boolean, refuerzo:boolean, pedreria:boolean, encapsulado:boolean, diseno_por_una:boolean }>
  image_score?: 0|1|2|number
}
