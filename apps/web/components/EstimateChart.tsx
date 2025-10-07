'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PriceEstimate } from '@/lib/price'
export function EstimateChart({ estimate }:{ estimate: PriceEstimate }){
  const data = [
    { name:'Base (h)', value: estimate.hours_base },
    { name:'Largo/forma', value: estimate.hours_add_length_shape },
    { name:'Arte', value: estimate.hours_add_art },
    { name:'Extras', value: estimate.hours_add_extras },
    { name:'Imagen x', value: estimate.image_multiplier }
  ]
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name"/>
          <YAxis/>
          <Tooltip/>
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
