import { Circle, EventNames, Rect, Stage } from "../lib/event"
import Text from "../lib/text"

function startEventDemo() {
  const canvas = document.querySelector('#event')
  if (!canvas) return

  const stage = new Stage(canvas as HTMLCanvasElement)
  const rect = new Rect({
    x: 50,
    y: 50,
    width: 250,
    height: 175,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: 'green',
  })
  stage.add(rect)

  const circle = new Circle({
    x: 200,
    y: 200,
    radius: 100,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: 'red',
  })
  stage.add(circle)

  let isStart = false
  rect.on(EventNames.mousedown, () => {
    isStart = true
  })
  rect.on(EventNames.mouseup, () => {
    isStart = false
  })
  rect.on(EventNames.mouseleave, () => {
    isStart = false
  })
  rect.on(EventNames.mousemove, (evt: MouseEvent) => {
    if (isStart) {
      rect.attr({
        x: evt.offsetX - 125,
        y: evt.offsetY - 140
      })
    }
  })

  circle.on(EventNames.click, () => {
    console.log('circle click!!')
    circle.attr({
      x: 400,
      y: 400,
    })
  })
}

function startTextInputDemo() {
  const canvas = document.querySelector('#text')
  if (!canvas) return
  const text = new Text(canvas as HTMLCanvasElement)
  text.attr({
    text: 'hufe123这是一段话'
  })
  text.draw()
}

export { startEventDemo, startTextInputDemo }