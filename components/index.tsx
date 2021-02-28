import React, { useEffect } from 'react'
import { startEventDemo, startTextInputDemo } from '../test'
export default function Index() {

  useEffect(() => {
    // 事件demo
    startEventDemo()

    // 文本输入demo
    startTextInputDemo()
  }, [])

  return (
    <div className="container">
      <canvas id="text" style={{ width: '500px', height: '500px' }}></canvas>
      <canvas id="event" style={{ width: '500px', height: '500px' }}></canvas>
    </div>
  )
}