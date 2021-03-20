import React, { useEffect } from 'react'
import Teeth from "../lib/teeth/index"
import index from "./index.json"

export default function Index() {

  useEffect(() => {
    const canvas = document.querySelector('#teeth')
    if (!canvas) return
    const teeth = new Teeth(canvas as HTMLCanvasElement)
    teeth.attr({
      values: index
    })
    teeth.draw()

    const img = teeth.snapshot()
    img.style.height = `50px`
    document.body.append(img)
  }, [])

  return (
    <div className="container">
      <canvas id="teeth" style={{ width: '500px', height: '50px' }}></canvas>
    </div>
  )
}