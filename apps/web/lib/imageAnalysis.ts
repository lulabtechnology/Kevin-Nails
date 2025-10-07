// Análisis simple con Sobel (en el cliente) para dar score 0..2
export async function analyzeImageSobel(file: File): Promise<0|1|2> {
  const img = await fileToImage(file)
  const { canvas, ctx } = toCanvas(img)
  const { w, h } = { w: canvas.width, h: canvas.height }
  const imgData = ctx.getImageData(0,0,w,h)
  const gray = new Float32Array(w*h)
  for(let i=0;i<w*h;i++){
    const r = imgData.data[i*4], g = imgData.data[i*4+1], b = imgData.data[i*4+2]
    gray[i] = 0.299*r + 0.587*g + 0.114*b
  }
  const gxK = [-1,0,1,-2,0,2,-1,0,1]
  const gyK = [-1,-2,-1,0,0,0,1,2,1]
  let sum = 0
  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
      let gx=0, gy=0, k=0
      for(let ky=-1;ky<=1;ky++){
        for(let kx=-1;kx<=1;kx++){
          const v = gray[(y+ky)*w + (x+kx)]
          gx += v * gxK[k]
          gy += v * gyK[k]
          k++
        }
      }
      sum += Math.hypot(gx,gy)
    }
  }
  const avg = sum / (w*h)
  // cuantizar a 0..2 (bordes: más complejo → más tiempo → mayor multiplicador)
  if(avg < 15) return 0
  if(avg < 35) return 1
  return 2
}

function fileToImage(file: File): Promise<HTMLImageElement>{
  return new Promise((resolve,reject)=>{
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = ()=>resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function toCanvas(img: HTMLImageElement){
  const scale = Math.min(512 / img.width, 512 / img.height, 1)
  const w = Math.max(64, Math.round(img.width*scale))
  const h = Math.max(64, Math.round(img.height*scale))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0,0,w,h)
  return { canvas, ctx }
}
