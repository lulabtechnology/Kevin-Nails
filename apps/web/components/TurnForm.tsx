'use client'

import { useEffect, useRef } from 'react'
import { analyzeImageSobel } from '@/lib/imageAnalysis'
import { TurnFormData } from '@/lib/types'

export type { TurnFormData }
export const defaultForm: TurnFormData = {
  customer_name: 'Ana Cliente',
  email: 'ana@example.com',
  phone: '6000-0000',
  service: 'gel',
  hand_or_feet: 'hands',
  length: 'medium',
  shape: 'almendra',
  color: 'nude',
  nail_art_level: 'simple',
  nail_art_count: 2,
  extras: { retiro:false, refuerzo:false, pedreria:false, encapsulado:false, diseno_por_una:false },
  image_score: 0
}

export function TurnForm({ value, onChange, imageRef }:{
  value: TurnFormData,
  onChange: (v:TurnFormData)=>void,
  imageRef: React.MutableRefObject<File|null>
}){
  const fileInput = useRef<HTMLInputElement|null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]
    if(!f) return
    imageRef.current = f
    const score = await analyzeImageSobel(f) // 0..2
    onChange({ ...value, image_score: score })
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Reservar mi número</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <input className="border rounded-xl p-2 col-span-2" placeholder="Nombre"
          value={value.customer_name} onChange={e=>onChange({...value, customer_name:e.target.value})}/>
        <input className="border rounded-xl p-2" placeholder="Email"
          value={value.email} onChange={e=>onChange({...value, email:e.target.value})}/>
        <input className="border rounded-xl p-2" placeholder="Teléfono"
          value={value.phone} onChange={e=>onChange({...value, phone:e.target.value})}/>
        <select className="border rounded-xl p-2"
          value={value.service} onChange={e=>onChange({...value, service:e.target.value as any})}>
          <option value="manicure">manicure</option>
          <option value="pedicure">pedicure</option>
          <option value="acrilico">acrilico</option>
          <option value="gel">gel</option>
          <option value="polygel">polygel</option>
          <option value="presson">press-on</option>
        </select>
        <select className="border rounded-xl p-2"
          value={value.hand_or_feet} onChange={e=>onChange({...value, hand_or_feet:e.target.value as any})}>
          <option value="hands">manos</option>
          <option value="feet">pies</option>
        </select>
        <select className="border rounded-xl p-2"
          value={value.length} onChange={e=>onChange({...value, length:e.target.value as any})}>
          <option value="short">short</option>
          <option value="medium">medium</option>
          <option value="long">long</option>
          <option value="xlong">xlong</option>
        </select>
        <select className="border rounded-xl p-2"
          value={value.shape} onChange={e=>onChange({...value, shape:e.target.value as any})}>
          <option value="redonda">redonda</option>
          <option value="cuadrada">cuadrada</option>
          <option value="almendra">almendra</option>
          <option value="coffin">coffin</option>
          <option value="stiletto">stiletto</option>
        </select>
        <input className="border rounded-xl p-2 col-span-2" placeholder="Color"
          value={value.color} onChange={e=>onChange({...value, color:e.target.value})}/>
        <select className="border rounded-xl p-2"
          value={value.nail_art_level} onChange={e=>onChange({...value, nail_art_level:e.target.value as any})}>
          <option value="none">sin arte</option>
          <option value="simple">simple</option>
          <option value="medium">medio</option>
          <option value="advanced">avanzado</option>
        </select>
        <input type="number" min={0} className="border rounded-xl p-2" placeholder="# uñas con arte"
          value={value.nail_art_count} onChange={e=>onChange({...value, nail_art_count: Number(e.target.value)})}/>
        <div className="col-span-2 grid grid-cols-2 gap-2">
          {(['retiro','refuerzo','pedreria','encapsulado','diseno_por_una'] as const).map(k=>(
            <label key={k} className="flex items-center gap-2">
              <input type="checkbox" checked={Boolean(value.extras[k])}
                onChange={e=>onChange({...value, extras: {...value.extras, [k]: e.target.checked}})} />
              <span>{k.replace('_',' ')}</span>
            </label>
          ))}
        </div>
        <div className="col-span-2">
          <input ref={fileInput} type="file" accept="image/*" onChange={onFile}/>
          <div className="text-xs opacity-70 mt-1">Score imagen (0..2): <b>{value.image_score ?? 0}</b></div>
        </div>
      </div>
    </div>
  )
}
