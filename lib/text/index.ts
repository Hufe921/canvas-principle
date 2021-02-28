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

export default class Text {

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private textProp: ITextProp | null
  private position: IPosition[]
  private cursorPosition: [number, number] | null
  private imgData: ImageData | null
  private interval: number | null

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

    canvas.addEventListener('click', this.handleClick.bind(this))
  }

  handleClick(evt: MouseEvent) {
    if (!this.textProp) return
    const x = evt.offsetX
    const y = evt.offsetY
    // 判断位置
    for (let j = 0; j < this.position.length; j++) {
      const { coordinate: { leftTop, rightTop, leftBottom } } = this.position[j];
      if (leftTop[0] <= x && rightTop[0] >= x && leftTop[1] <= y && leftBottom[1] >= y) {
        this.cursorPosition = [rightTop[0], rightTop[1]]
        if (this.interval) {
          clearInterval(this.interval)
        }
        // 清除旧光标位置
        this.clearCursor()
        // 缓存状态
        this.imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
        this.drawCurosr()
        this.interval = setInterval(() => {
          this.drawCurosr()
        }, 1000)
      }
    }
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

  clearCursor() {
    if (this.imgData) {
      this.ctx.putImageData(this.imgData, 0, 0)
    }
  }

  drawCurosr() {
    if (this.cursorPosition) {
      const [x, y] = this.cursorPosition
      this.ctx.fillRect(x, y, 1, 20)
    }
    setTimeout(() => {
      this.clearCursor()
    }, 500)
  }
}