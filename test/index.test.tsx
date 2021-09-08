import React, { useRef, useState, useEffect } from 'react'
import { startTextInputDemo, startEventDemo } from './fixtures/index'
import './fixtures/index.css'

export default function Index() {

  const repl = useRef<HTMLDivElement>(null)
  const [type, setType] = useState<string>('text')

  useEffect(() => {
    handleClick('text')
  }, [])

  const handleClick = (key: string) => {
    if (repl.current) {
      repl.current.childNodes.forEach(c => c.remove())
    }
    setType(key)
    const canvas = document.createElement('canvas')
    canvas.style.width = '500px'
    canvas.style.height = '500px'
    canvas.id = key
    repl.current?.append(canvas)
    switch (key) {
      case 'text':
        startTextInputDemo(canvas)
        break;
      case 'event':
        startEventDemo(canvas)
        break;
      default:
        break;
    }
  }

  return (
    <div className="container">
      <ul>
        <li className={type === 'text' ? 'active' : ''} onClick={() => handleClick('text')}>文本编辑器</li>
        <li className={type === 'event' ? 'active' : ''} onClick={() => handleClick('event')}>事件</li>
      </ul>
      <div ref={repl}></div>
    </div>
  )
}