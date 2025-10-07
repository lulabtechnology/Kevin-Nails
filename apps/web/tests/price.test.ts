import { computePrice } from '@/lib/price'

test('precio mínimo con manicure simple', ()=>{
  const e = computePrice({
    service: 'manicure',
    hand_or_feet: 'hands',
    length: 'short',
    shape: 'redonda',
    nail_art_level: 'none',
    nail_art_count: 0,
    extras: {},
    image_score: 0
  })
  expect(e.total).toBeGreaterThan(0)
  expect(e.deposit).toBeGreaterThan(0)
})

test('gel medium almendra con arte simple', ()=>{
  const e = computePrice({
    service: 'gel',
    hand_or_feet: 'hands',
    length: 'medium',
    shape: 'almendra',
    nail_art_level: 'simple',
    nail_art_count: 2,
    extras: { retiro: true },
    image_score: 1
  })
  expect(e.hours).toBeGreaterThan(1)
  expect(e.image_multiplier).toBe(1.4)
})

test('xlong stiletto avanzado con extras', ()=>{
  const e = computePrice({
    service: 'acrilico',
    hand_or_feet: 'hands',
    length: 'xlong',
    shape: 'stiletto',
    nail_art_level: 'advanced',
    nail_art_count: 10,
    extras: { refuerzo:true, encapsulado:true, pedreria:true },
    image_score: 2
  })
  expect(e.total).toBeGreaterThan(100)
  expect(e.deposit).toBeGreaterThan(5)
})
