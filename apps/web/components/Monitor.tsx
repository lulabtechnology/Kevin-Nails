export function Monitor({ queue }:{ queue: {current_number:number,is_open:boolean,next_number:number} | null }){
  return (
    <div className="card flex items-center justify-between">
      <div>
        <div className="text-sm opacity-70">Número actual</div>
        <div className="text-4xl font-bold">{queue?.current_number ?? 0}</div>
      </div>
      <div>
        <div className="text-sm opacity-70">Siguiente a llamar</div>
        <div className="text-2xl font-semibold">{queue?.next_number ?? 1}</div>
      </div>
      <div className="text-sm">{queue?.is_open ? 'Abierto' : 'Cerrado'}</div>
    </div>
  )
}
