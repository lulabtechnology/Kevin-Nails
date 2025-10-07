'use client'

import { useRef, useState } from 'react'
import type { TurnFormData } from '@/lib/types'
import { analyzeImageSobel } from '@/lib/imageAnalysis'

export type { TurnFormData }
export const defaultFormData: TurnFormData = {
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
  image_score: 0,
}

export function TurnForm({
  value,
  onChange,
  imageRef,
}: {
  value: TurnFormData
  onChange: (v: TurnFormData) => void
  imageRef: React.MutableRefObject<File | null>
}) {
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | undefined>()

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    imageRef.current = f
    // preview
    const url = URL.createObjectURL(f)
    setPreview(url)
    // calcula score con el File (no Uint8Array)
    try {
      const scoreAny = await analyzeImageSobel(f)
      const scoreNum = Math.trunc(Number(scoreAny ?? 0))
      const clamped = Math.max(0, Math.min(2, scoreNum)) as 0 | 1 | 2
      onChange({ ...value, image_score: clamped })
    } catch {
      onChange({ ...value, image_score: 0 })
    }
  }

  function set<K extends keyof TurnFormData>(k: K, v: TurnFormData[K]) {
    onChange({ ...value, [k]: v })
  }

  const imgScoreSafe = Math.trunc(Number(value.image_score ?? 0))

  return (
    <div className="space-y-3">
      <input
        className="input"
        placeholder="Nombre"
        value={value.customer_name}
        onChange={(e) => set('customer_name', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="input"
          placeholder="email@dominio.com"
          value={value.email}
          onChange={(e) => set('email', e.target.value)}
        />
        <input
          className="input"
          placeholder="6000-0000"
          value={value.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={value.service} onChange={(e) => set('service', e.target.value as any)}>
          <option value="manicure">manicure</option>
          <option value="pedicure">pedicure</option>
          <option value="acrilico">acrilico</option>
          <option value="gel">gel</option>
          <option value="polygel">polygel</option>
          <option value="presson">presson</option>
        </select>
        <select
          className="input"
          value={value.hand_or_feet}
          onChange={(e) => set('hand_or_feet', e.target.value as any)}
        >
          <option value="hands">manos</option>
          <option value="feet">pies</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select className="input" value={value.length} onChange={(e) => set('length', e.target.value as any)}>
          <option value="short">short</option>
          <option value="medium">medium</option>
          <option value="long">long</option>
          <option value="xlong">xlong</option>
        </select>
        <select className="input" value={value.shape} onChange={(e) => set('shape', e.target.value as any)}>
          <option value="redonda">redonda</option>
          <option value="cuadrada">cuadrada</option>
          <option value="almendra">almendra</option>
          <option value="coffin">coffin</option>
          <option value="stiletto">stiletto</option>
        </select>
        <input className="input" placeholder="color" value={value.color} onChange={(e) => set('color', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          className="input"
          value={value.nail_art_level}
          onChange={(e) => set('nail_art_level', e.target.value as any)}
        >
          <option value="none">sin arte</option>
          <option value="simple">simple</option>
          <option value="medium">medium</option>
          <option value="advanced">advanced</option>
        </select>
        <input
          type="number"
          className="input"
          min={0}
          value={value.nail_art_count}
          onChange={(e) => set('nail_art_count', Number(e.target.value || 0))}
        />
      </div>

      <fieldset className="grid grid-cols-2 gap-2 text-sm">
        {Object.keys(value.extras || {}).map((k) => (
          <label key={k} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean((value.extras as any)?.[k])}
              onChange={(e) => onChange({ ...value, extras: { ...value.extras, [k]: e.target.checked } })}
            />
            {k.replaceAll('_', ' ')}
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-2">
        <input ref={fileInput} type="file" accept="image/*" onChange={onFile} />
        <span className="text-xs">Score imagen (0–2): {imgScoreSafe}</span>
      </div>

      {preview && (
        <div className="rounded-xl overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full h-48 object-cover" />
        </div>
      )}
    </div>
  )
}
