interface ITextAttr {
  text: string;
  font?: string;
  textBaseline?: CanvasTextBaseline;
}

interface ITextProp {
  text: string;
  font: string;
  textBaseline: CanvasTextBaseline;
  arrText: string[]
}

interface IPosition {
  i: number;
  coordinate: {
    leftTop: number[];
    leftBottom: number[];
    rightTop: number[];
    rightBottom: number[];
  }
}
import './index.css'
import { KeyMap } from './keymap'
export default class Text {

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private textProp: ITextProp | null
  private position: IPosition[]
  private cursorPosition: IPosition | null
  private imgData: ImageData | null
  private interval: number | null
  private timeout: number | null
  private inputarea: HTMLTextAreaElement

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio;
    canvas.width = parseInt(canvas.style.width) * dpr;
    canvas.height = parseInt(canvas.style.height) * dpr;
    this.canvas = canvas
    // @ts-ignore
    this.ctx = ctx
    this.ctx.scale(dpr, dpr)
    this.textProp = null
    this.position = []
    this.cursorPosition = null
    this.imgData = null
    this.interval = null
    this.timeout = null

    const textarea = document.createElement('textarea')
    textarea.autocomplete = 'off'
    textarea.classList.add('inputarea')
    this.inputarea = textarea
    textarea.onkeydown = (evt: KeyboardEvent) => this.handKeydown(evt)
    document.body.append(textarea)

    canvas.addEventListener('click', this.handleClick.bind(this))
  }

  attr(props: ITextAttr) {
    this.textProp = {
      text: props.text,
      font: props.font || '20px yahei',
      textBaseline: props.textBaseline || 'hanging',
      arrText: props.text.split('')
    }
  }

  draw() {
    if (!this.textProp) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    let x = 0
    this.position = []
    const { arrText, font, textBaseline } = this.textProp
    // 绘制文本
    this.ctx.save()
    this.ctx.font = font
    this.ctx.textBaseline = textBaseline
    for (let i = 0; i < arrText.length; i++) {
      const word = arrText[i];
      const metrics = this.ctx.measureText(word)
      const h = metrics.fontBoundingBoxDescent
      const width = metrics.width
      const positionItem = {
        i,
        coordinate: {
          leftTop: [x, 0],
          leftBottom: [x, h],
          rightTop: [x + width, 0],
          rightBottom: [x + width, h]
        }
      }
      this.position.push(positionItem)
      // 绘制矩形辅助框
      // ctx.strokeRect(x, 0, width, h)
      this.ctx.fillText(word, x, 0)
      x += width
    }
    this.ctx.restore()
  }

  handleClick(evt: MouseEvent) {
    if (!this.textProp) return
    const x = evt.offsetX
    const y = evt.offsetY
    for (let j = 0; j < this.position.length; j++) {
      const { coordinate: { leftTop, rightTop, leftBottom } } = this.position[j];
      if (leftTop[0] <= x && rightTop[0] >= x && leftTop[1] <= y && leftBottom[1] >= y) {
        this.cursorPosition = this.position[j]
        this.recoveryDrawCursor()
        this.initDrawCursor()
      }
    }
  }

  handKeydown(evt: KeyboardEvent) {
    if (!this.cursorPosition || !this.textProp) return
    if (evt.key === KeyMap.Backspace) {
      const { i } = this.cursorPosition
      const { arrText } = this.textProp
      arrText.splice(i, 1).join('')
      this.attr({
        text: arrText.join('')
      })
      // 恢复初始状态后重绘
      this.imgData = null
      this.recoveryDrawCursor()
      this.draw()
      this.cursorPosition = this.position[i - 1] || null
      this.initDrawCursor()
    }
  }

  initDrawCursor() {
    if (!this.cursorPosition) return
    // 缓存canvas状态
    this.imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.strokeCurosr()
    this.interval = setInterval(() => this.strokeCurosr(), 1000)
    // 设置光标代理
    this.inputarea.focus()
    this.inputarea.setSelectionRange(0, 0)
    const { coordinate: { rightTop: [x, y] } } = this.cursorPosition
    const { left, top } = this.canvas.getBoundingClientRect()
    this.inputarea.style.left = `${x + left}px`
    this.inputarea.style.top = `${y + top}px`
  }

  recoveryDrawCursor() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.clearCursor()
  }

  clearCursor() {
    if (this.imgData) {
      this.ctx.putImageData(this.imgData, 0, 0)
    }
  }

  strokeCurosr() {
    if (this.cursorPosition) {
      const { coordinate: { rightTop: [x, y] } } = this.cursorPosition
      this.ctx.fillRect(x, y, 1, 20)
    }
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.timeout = setTimeout(() => {
      this.clearCursor()
    }, 500)
  }
}