import './index.css'
import { ZERO } from './utils/dataset'
import { KeyMap } from './utils/keymap'
import { HistoryManager } from './core/HistoryManager'
import { ITextProp, ITextAttr, IPosition, IRange } from './interface'
export default class Text {

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private textProp: ITextProp | null
  private position: IPosition[]
  private range: IRange | null

  private cursorPosition: IPosition | null
  private imgData: ImageData | null
  private interval: number | null
  private timeout: number | null
  private inputarea: HTMLTextAreaElement
  private isCompositing: boolean
  private isAllowDrag: boolean
  private lineCount: number

  private historyManager: HistoryManager

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio;
    canvas.width = parseInt(canvas.style.width) * dpr;
    canvas.height = parseInt(canvas.style.height) * dpr;
    canvas.style.cursor = 'text'
    this.canvas = canvas
    this.ctx = ctx as CanvasRenderingContext2D
    this.ctx.scale(dpr, dpr)
    this.textProp = null
    this.position = []
    this.cursorPosition = null
    this.imgData = null
    this.interval = null
    this.timeout = null
    this.isCompositing = false
    this.isAllowDrag = false
    this.range = null
    this.lineCount = 0

    // 历史管理
    this.historyManager = new HistoryManager()

    // 全局事件
    document.addEventListener('click', (evt) => {
      if (evt.target === this.canvas) return
      this.recoveryDrawCursor()
    })

    // 事件监听转发
    const textarea = document.createElement('textarea')
    textarea.autocomplete = 'off'
    textarea.classList.add('inputarea')
    textarea.innerText = ''
    this.inputarea = textarea
    textarea.onkeydown = (evt: KeyboardEvent) => this.handleKeydown(evt)
    textarea.oninput = (evt: Event) => {
      const data = (evt as InputEvent).data
      setTimeout(() => this.handleInput(data || ''))
    }
    textarea.onpaste = (evt: ClipboardEvent) => this.handlePaste(evt)
    textarea.addEventListener('compositionstart', this.handleCompositionstart.bind(this))
    textarea.addEventListener('compositionend', this.handleCompositionend.bind(this))
    document.body.append(textarea)

    // canvas原生事件
    canvas.addEventListener('click', this.handleClick.bind(this))
    canvas.addEventListener('mousedown', this.handleMousedown.bind(this))
    canvas.addEventListener('mouseleave', this.handleMouseleave.bind(this))
    canvas.addEventListener('mouseup', this.handleMouseup.bind(this))
    canvas.addEventListener('mousemove', this.handleMousemove.bind(this))
  }

  attr(props: ITextAttr) {
    const isZeroStart = new RegExp(`^${ZERO}`).test(props.text)
    const text = (!isZeroStart ? ZERO : '') + props.text.replace(/\n/g, ZERO)
    this.textProp = {
      text,
      font: props.font || '20px yahei',
      textBaseline: props.textBaseline || 'hanging',
      arrText: text.split('')
    }
  }

  draw(curIndex?: number, isSubmitHistory = true) {
    // 清除光标
    this.imgData = null
    this.recoveryDrawCursor()
    if (!this.textProp) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    let x = 0
    let y = 0
    this.position = []
    const { arrText, font, textBaseline } = this.textProp
    // 绘制文本
    this.ctx.save()
    this.ctx.font = font
    this.ctx.textBaseline = textBaseline
    // 记录当前行
    let lineStr = ''
    let lineNo = 0
    for (let i = 0; i < arrText.length; i++) {
      // 字符基本信息
      const word = arrText[i];
      const metrics = this.ctx.measureText(word)
      const height = metrics.fontBoundingBoxDescent
      const width = metrics.width
      // 计算宽度是否超出画布
      const curLineWidth = this.ctx.measureText(lineStr).width
      const canvasWidth = this.canvas.getBoundingClientRect().width
      if (curLineWidth + width > canvasWidth || (i !== 0 && word === ZERO)) {
        x = 0
        y += height
        lineStr = word
        lineNo += 1
      } else {
        lineStr += word
      }
      const positionItem = {
        i,
        lineNo,
        isLastLetter: false,
        coordinate: {
          leftTop: [x, y],
          leftBottom: [x, y + height],
          rightTop: [x + width, y],
          rightBottom: [x + width, y + height]
        }
      }
      if (x === 0 && i !== 0) {
        if (y !== this.position[i - 1].coordinate.leftTop[1]) {
          this.position[i - 1].isLastLetter = true
        }
      }
      this.position.push(positionItem)
      this.ctx.fillText(word, x, y)
      x += width
    }
    if (curIndex === undefined) {
      curIndex = this.position.length - 1
    }
    // 光标重绘
    this.cursorPosition = this.position[curIndex!] || null
    this.initDrawCursor()
    // 最后一个字距离顶部高度
    const lastPosition = this.position[this.position.length - 1]
    const { coordinate: { leftBottom, leftTop } } = lastPosition
    if (leftBottom[1] > this.canvas.height) {
      const height = Math.ceil(leftBottom[1] + (leftBottom[1] - leftTop[1]))
      this.canvas.height = height
      this.canvas.style.height = `${height}px`
      this.draw(curIndex, false)
    }
    this.lineCount = lineNo
    this.ctx.restore()
    // 历史记录-用于undo、redo
    if (isSubmitHistory) {
      const self = this
      const oldText = arrText.join('')
      this.historyManager.execute(function () {
        self.attr({
          text: oldText
        })
        self.draw(curIndex, false)
      })
    }
  }

  handleMousedown() {
    this.isAllowDrag = true
  }

  handleMouseleave() {
    this.isAllowDrag = false
  }

  handleMouseup() {
    this.isAllowDrag = false
  }

  handleMousemove() {
    if (!this.isAllowDrag) return
  }

  handleClick(evt: MouseEvent) {
    if (!this.textProp) return
    const { arrText } = this.textProp
    const x = evt.offsetX
    const y = evt.offsetY
    let isTextArea = false
    for (let j = 0; j < this.position.length; j++) {
      const { i, coordinate: { leftTop, rightTop, leftBottom } } = this.position[j];
      // 命中文本
      if (leftTop[0] <= x && rightTop[0] >= x && leftTop[1] <= y && leftBottom[1] >= y) {
        let index = j
        // 判断是否文字中间前后
        if (arrText[i] !== ZERO) {
          const wordWidth = rightTop[0] - leftTop[0]
          if (x < leftTop[0] + wordWidth / 2) {
            index = j - 1
          }
        }
        this.cursorPosition = this.position[index]
        isTextArea = true
        break
      }
    }
    // 非命中区域
    if (!isTextArea) {
      let isLastArea = false
      // 判断所属行是否存在文本
      const firstLetterList = this.position.filter(p => p.isLastLetter)
      for (let j = 0; j < firstLetterList.length; j++) {
        const { i, coordinate: { leftTop, leftBottom } } = firstLetterList[j]
        if (y > leftTop[1] && y <= leftBottom[1]) {
          this.cursorPosition = this.position[i]
          isLastArea = true
          break
        }
      }
      if (!isLastArea) {
        this.cursorPosition = this.position[this.position.length - 1]
      }
    }
    // 绘制光标
    this.recoveryDrawCursor()
    this.initDrawCursor()
  }

  handleKeydown(evt: KeyboardEvent) {
    if (!this.cursorPosition || !this.textProp) return
    const { i } = this.cursorPosition
    const { arrText } = this.textProp
    if (evt.key === KeyMap.Backspace) {
      // 判断是否允许删除
      if (arrText[i] === ZERO && i === 0) {
        evt.preventDefault()
        return
      }
      arrText.splice(i, 1)
      this.attr({
        text: arrText.join('')
      })
      this.draw(i - 1)
    } else if (evt.key === KeyMap.Enter) {
      arrText.splice(i + 1, 0, ZERO)
      this.attr({
        text: arrText.join('')
      })
      this.draw(i + 1)
    } else if (evt.key === KeyMap.Left) {
      if (i > 0) {
        this.cursorPosition = this.position[i - 1]
        this.recoveryDrawCursor()
        this.initDrawCursor()
      }
    } else if (evt.key === KeyMap.Right) {
      if (i < this.position.length - 1) {
        this.cursorPosition = this.position[i + 1]
        this.recoveryDrawCursor()
        this.initDrawCursor()
      }
    } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
      const { lineNo, i, coordinate: { leftTop, rightTop } } = this.cursorPosition
      if ((evt.key === KeyMap.Up && lineNo !== 0) || (evt.key === KeyMap.Down && lineNo !== this.lineCount)) {
        // 下一个光标点所在行位置集合
        const probablePosition = evt.key === KeyMap.Up
          ? this.position.slice(0, i).filter(p => p.lineNo === lineNo - 1)
          : this.position.slice(i, this.position.length - 1).filter(p => p.lineNo === lineNo + 1)
        // 查找与当前位置文字点交叉最多的位置
        let maxIndex = 0
        let maxDistance = 0
        for (let p = 0; p < probablePosition.length; p++) {
          const position = probablePosition[p]
          // 当前光标在前
          if (position.coordinate.leftTop[0] >= leftTop[0] && position.coordinate.leftTop[0] <= rightTop[0]) {
            const curDistance = rightTop[0] - position.coordinate.leftTop[0]
            if (curDistance > maxDistance) {
              maxIndex = position.i
              maxDistance = curDistance
            }
          }
          // 当前光标在后
          else if (position.coordinate.leftTop[0] <= leftTop[0] && position.coordinate.rightTop[0] >= leftTop[0]) {
            const curDistance = position.coordinate.rightTop[0] - leftTop[0]
            if (curDistance > maxDistance) {
              maxIndex = position.i
              maxDistance = curDistance
            }
          }
          // 匹配不到
          if (p === probablePosition.length - 1 && maxIndex === 0) {
            maxIndex = position.i
          }
        }
        this.cursorPosition = this.position[maxIndex]
        this.recoveryDrawCursor()
        this.initDrawCursor()
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.Z) {
      this.historyManager.undo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.Y) {
      this.historyManager.redo()
      evt.preventDefault()
    }
  }

  handleInput(data: string) {
    if (
      !data ||
      !this.cursorPosition ||
      !this.textProp ||
      this.isCompositing
    ) {
      return
    }
    this.inputarea.value = ''
    const { i } = this.cursorPosition
    const { arrText } = this.textProp
    arrText.splice(i + 1, 0, data).join('')
    this.attr({
      text: arrText.join('')
    })
    this.draw(i + data.length)
  }

  handlePaste(evt: ClipboardEvent) {
    const text = evt.clipboardData?.getData('text')
    this.handleInput(text || '')
    evt.preventDefault()
  }

  handleCompositionstart() {
    this.isCompositing = true
  }

  handleCompositionend() {
    this.isCompositing = false
  }

  initDrawRange() {
    const range = this.range
    if (!range) return
    // 选区位置
    const { coordinate: start } = this.position[range.startIndex]
    const { coordinate: end } = this.position[range.endIndex]
    const x = start.leftTop[0]
    const y = start.leftTop[1]
    const width = end.rightTop[0] - start.leftTop[0]
    const height = end.rightBottom[1] - end.rightTop[1]
    // 绘制
    this.ctx.save()
    this.ctx.globalAlpha = 0.6
    this.ctx.fillStyle = '#AECBFA'
    this.ctx.fillRect(x, y, width, height)
    this.ctx.restore()
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