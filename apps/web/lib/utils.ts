export function todayStr(){
  const d = new Date()
  return d.toISOString().slice(0,10)
}
export function toMoney(n:number){
  return `$${n.toFixed(2)}`
}
