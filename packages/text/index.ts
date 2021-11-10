import './index.css'
import { ZERO } from './utils/dataset'
import { KeyMap } from './utils/keymap'
import { deepClone, writeText } from './utils/utils'
import { HistoryManager } from './core/HistoryManager'
import { ITextAttr, IPosition, IRange, IDrawOptions, IText } from './interface'
export default class Text {

  private readonly RANGE_COLOR = '#AECBFA'

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private textList: IText[]
  private position: IPosition[]
  private range: IRange

  private cursorPosition: IPosition | null
  private cursorDom: HTMLDivElement
  private textareaDom: HTMLTextAreaElement
  private inputarea: HTMLTextAreaElement
  private isCompositing: boolean
  private isAllowDrag: boolean
  private lineCount: number
  private mouseDownStartIndex: number

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
    this.textList = []
    this.position = []
    this.cursorPosition = null
    this.isCompositing = false
    this.isAllowDrag = false
    this.range = {
      startIndex: 0,
      endIndex: 0
    }
    this.lineCount = 0
    this.mouseDownStartIndex = 0

    // 历史管理
    this.historyManager = new HistoryManager()

    // 全局事件
    document.addEventListener('click', (evt) => {
      const innerDoms = [this.canvas, this.cursorDom, this.textareaDom, document.body]
      if (innerDoms.includes(evt.target as any)) return
      this.recoveryCursor()
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
    this.textareaDom = textarea

    // 光标
    this.cursorDom = document.createElement('div')
    this.cursorDom.classList.add('cursor')
    document.body.append(this.cursorDom)

    // canvas原生事件
    canvas.addEventListener('mousedown', this.setCursor.bind(this))
    canvas.addEventListener('mousedown', this.handleMousedown.bind(this))
    canvas.addEventListener('mouseleave', this.handleMouseleave.bind(this))
    canvas.addEventListener('mouseup', this.handleMouseup.bind(this))
    canvas.addEventListener('mousemove', this.handleMousemove.bind(this))
  }

  attr(attr: ITextAttr) {
    const { textList } = attr
    const isZeroStart = textList[0].value === ZERO
    if (!isZeroStart) {
      textList.unshift({
        type: 'TEXT',
        value: ZERO
      })
    }
    textList.forEach(text => {
      if (text.value === '\n') {
        text.value = ZERO
      }
    })
    this.textList = textList
  }

  draw(options?: IDrawOptions) {
    let { curIndex, isSubmitHistory = true, isSetCursor = true } = options || {}
    // 清除光标
    this.recoveryCursor()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    let x = 0
    let y = 0
    this.position = []
    // 绘制文本
    this.ctx.save()
    this.ctx.font = '20px yahei'
    this.ctx.textBaseline = 'hanging'
    // 记录当前行
    let lineStr = ''
    let lineNo = 0
    for (let i = 0; i < this.textList.length; i++) {
      // 字符基本信息
      const value = this.textList[i].value;
      const metrics = this.ctx.measureText(value)
      const height = metrics.fontBoundingBoxDescent
      const width = metrics.width
      // 计算宽度是否超出画布
      const curLineWidth = this.ctx.measureText(lineStr).width
      const canvasWidth = this.canvas.getBoundingClientRect().width
      if (curLineWidth + width > canvasWidth || (i !== 0 && value === ZERO)) {
        x = 0
        y += height
        lineStr = value
        lineNo += 1
      } else {
        lineStr += value
      }
      const positionItem: IPosition = {
        index: i,
        value,
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
      this.ctx.fillText(value, x, y)
      // 选区绘制
      const { startIndex, endIndex } = this.range
      if (startIndex !== endIndex && startIndex < i && i <= endIndex) {
        this.ctx.save()
        this.ctx.globalAlpha = 0.6
        this.ctx.fillStyle = this.RANGE_COLOR
        this.ctx.fillRect(x, y, width, height)
        this.ctx.restore()
      }
      x += width
    }
    if (curIndex === undefined) {
      curIndex = this.position.length - 1
    }
    // 光标重绘
    if (isSetCursor) {
      this.cursorPosition = this.position[curIndex!] || null
      this.drawCursor()
    }
    // 最后一个字距离顶部高度
    const lastPosition = this.position[this.position.length - 1]
    const { coordinate: { leftBottom, leftTop } } = lastPosition
    if (leftBottom[1] > this.canvas.height) {
      const height = Math.ceil(leftBottom[1] + (leftBottom[1] - leftTop[1]))
      this.canvas.height = height
      this.canvas.style.height = `${height}px`
      this.draw({ curIndex, isSubmitHistory: false })
    }
    this.lineCount = lineNo
    this.ctx.restore()
    // 历史记录-用于undo、redo
    if (isSubmitHistory) {
      const self = this
      const oldTextList = deepClone(this.textList)
      this.historyManager.execute(function () {
        self.textList = deepClone(oldTextList)
        self.draw({ curIndex, isSubmitHistory: false })
      })
    }
  }

  getCursorPosition(evt: MouseEvent): number {
    const x = evt.offsetX
    const y = evt.offsetY
    let isTextArea = false
    for (let j = 0; j < this.position.length; j++) {
      const { index, coordinate: { leftTop, rightTop, leftBottom } } = this.position[j];
      // 命中文本
      if (leftTop[0] <= x && rightTop[0] >= x && leftTop[1] <= y && leftBottom[1] >= y) {
        let curPostionIndex = j
        // 判断是否文字中间前后
        if (this.textList[index].value !== ZERO) {
          const valueWidth = rightTop[0] - leftTop[0]
          if (x < leftTop[0] + valueWidth / 2) {
            curPostionIndex = j - 1
          }
        }
        isTextArea = true
        return curPostionIndex
      }
    }
    // 非命中区域
    if (!isTextArea) {
      let isLastArea = false
      let curPostionIndex = -1
      // 判断所属行是否存在文本
      const firstLetterList = this.position.filter(p => p.isLastLetter)
      for (let j = 0; j < firstLetterList.length; j++) {
        const { index, coordinate: { leftTop, leftBottom } } = firstLetterList[j]
        if (y > leftTop[1] && y <= leftBottom[1]) {
          curPostionIndex = index
          isLastArea = true
          break
        }
      }
      if (!isLastArea) {
        return this.position.length - 1
      }
      return curPostionIndex
    }
    return -1
  }

  setCursor(evt: MouseEvent) {
    const positionIndex = this.getCursorPosition(evt)
    if (~positionIndex) {
      this.range.startIndex = 0
      this.range.endIndex = 0
      setTimeout(() => {
        this.draw({ curIndex: positionIndex, isSubmitHistory: false })
      })
    }
  }

  drawCursor() {
    if (!this.cursorPosition) return
    // 设置光标代理
    const { coordinate: { rightTop: [x, y] } } = this.cursorPosition
    this.inputarea.focus()
    this.inputarea.setSelectionRange(0, 0)
    const { left, top } = this.canvas.getBoundingClientRect()
    const curosrleft = `${x + left}px`
    const cursorTop = `${y + top}px`
    this.inputarea.style.left = curosrleft
    this.inputarea.style.top = cursorTop
    // 模拟光标显示
    this.cursorDom.style.left = curosrleft
    this.cursorDom.style.top = cursorTop
    this.cursorDom.style.display = 'block'
    setTimeout(() => {
      this.cursorDom.classList.add('cursor--animation')
    }, 200)
  }

  recoveryCursor() {
    this.cursorDom.style.display = 'none'
    this.cursorDom.classList.remove('cursor--animation')
  }

  strokeRange() {
    this.draw({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  clearRange() {
    this.range.startIndex = 0
    this.range.endIndex = 0
  }

  handleMousemove(evt: MouseEvent) {
    if (!this.isAllowDrag) return
    // 结束位置
    const endIndex = this.getCursorPosition(evt)
    let end = ~endIndex ? endIndex : 0
    // 开始位置
    let start = this.mouseDownStartIndex
    if (start > end) {
      [start, end] = [end, start]
    }
    this.range.startIndex = start
    this.range.endIndex = end
    // 绘制选区
    this.strokeRange()
  }

  handleMousedown(evt: MouseEvent) {
    this.isAllowDrag = true
    this.mouseDownStartIndex = this.getCursorPosition(evt) || 0
  }

  handleMouseleave(evt: MouseEvent) {
    // 是否还在canvas内部
    const { x, y, width, height } = this.canvas.getBoundingClientRect()
    if (evt.x >= x && evt.x <= x + width && evt.y >= y && evt.y <= y + height) return
    this.isAllowDrag = false
  }

  handleMouseup() {
    this.isAllowDrag = false
  }

  handleKeydown(evt: KeyboardEvent) {
    if (!this.cursorPosition) return
    const { index } = this.cursorPosition
    const { startIndex, endIndex } = this.range
    const isCollspace = startIndex === endIndex
    if (evt.key === KeyMap.Backspace) {
      // 判断是否允许删除
      if (this.textList[index].value === ZERO && index === 0) {
        evt.preventDefault()
        return
      }
      if (!isCollspace) {
        this.textList.splice(startIndex + 1, endIndex - startIndex)
      } else {
        this.textList.splice(index, 1)
      }
      this.clearRange()
      this.draw({ curIndex: isCollspace ? index - 1 : startIndex })
    } else if (evt.key === KeyMap.Enter) {
      const enterText: IText = {
        type: 'TEXT',
        value: ZERO
      }
      if (isCollspace) {
        this.textList.splice(index + 1, 0, enterText)
      } else {
        this.textList.splice(startIndex + 1, endIndex - startIndex, enterText)
      }
      this.clearRange()
      this.draw({ curIndex: index + 1 })
    } else if (evt.key === KeyMap.Left) {
      if (index > 0) {
        this.clearRange()
        this.draw({ curIndex: index - 1, isSubmitHistory: false })
      }
    } else if (evt.key === KeyMap.Right) {
      if (index < this.position.length - 1) {
        this.clearRange()
        this.draw({ curIndex: index + 1, isSubmitHistory: false })
      }
    } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
      const { lineNo, index, coordinate: { leftTop, rightTop } } = this.cursorPosition
      if ((evt.key === KeyMap.Up && lineNo !== 0) || (evt.key === KeyMap.Down && lineNo !== this.lineCount)) {
        // 下一个光标点所在行位置集合
        const probablePosition = evt.key === KeyMap.Up
          ? this.position.slice(0, index).filter(p => p.lineNo === lineNo - 1)
          : this.position.slice(index, this.position.length - 1).filter(p => p.lineNo === lineNo + 1)
        // 查找与当前位置文字点交叉最多的位置
        let maxIndex = 0
        let maxDistance = 0
        for (let p = 0; p < probablePosition.length; p++) {
          const position = probablePosition[p]
          // 当前光标在前
          if (position.coordinate.leftTop[0] >= leftTop[0] && position.coordinate.leftTop[0] <= rightTop[0]) {
            const curDistance = rightTop[0] - position.coordinate.leftTop[0]
            if (curDistance > maxDistance) {
              maxIndex = position.index
              maxDistance = curDistance
            }
          }
          // 当前光标在后
          else if (position.coordinate.leftTop[0] <= leftTop[0] && position.coordinate.rightTop[0] >= leftTop[0]) {
            const curDistance = position.coordinate.rightTop[0] - leftTop[0]
            if (curDistance > maxDistance) {
              maxIndex = position.index
              maxDistance = curDistance
            }
          }
          // 匹配不到
          if (p === probablePosition.length - 1 && maxIndex === 0) {
            maxIndex = position.index
          }
        }
        this.clearRange()
        this.draw({ curIndex: maxIndex, isSubmitHistory: false })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.Z) {
      this.historyManager.undo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.Y) {
      this.historyManager.redo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.C) {
      if (!isCollspace) {
        writeText(this.textList.slice(startIndex + 1, endIndex + 1).map(p => p.value).join(''))
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.X) {
      if (!isCollspace) {
        writeText(this.position.slice(startIndex + 1, endIndex + 1).map(p => p.value).join(''))
        this.textList.splice(startIndex + 1, endIndex - startIndex)
        this.clearRange()
        this.draw({ curIndex: startIndex })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.A) {
      this.range.startIndex = 0
      this.range.endIndex = this.position.length - 1
      this.draw({ isSubmitHistory: false, isSetCursor: false })
    }
  }

  handleInput(data: string) {
    if (!data || !this.cursorPosition || this.isCompositing) return
    this.inputarea.value = ''
    const { index } = this.cursorPosition
    const { startIndex, endIndex } = this.range
    const isCollspace = startIndex === endIndex
    const inputData: IText[] = data.split('').map(value => ({
      value,
      type: 'TEXT',
    }))
    if (isCollspace) {
      this.textList.splice(index + 1, 0, ...inputData)
    } else {
      this.textList.splice(startIndex + 1, endIndex - startIndex, ...inputData)
    }
    this.clearRange()
    this.draw({ curIndex: (isCollspace ? index : startIndex) + inputData.length })
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

}