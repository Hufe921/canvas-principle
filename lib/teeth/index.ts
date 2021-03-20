interface IPropValue {
  emrepValue: string,
  cepConceptId: string
}

interface IProps {
  values: IPropValue[]
}

interface IQuadrantValue {
  surface: string;
  name: string;
  conceptId: string;
  display: string;
  quadrant: number;
  seq: number;
  emrepValue: string;
  cepConceptId: string;
}

interface IQuadrant {
  [Position.First]: IQuadrantValue[];
  [Position.Second]: IQuadrantValue[];
  [Position.Third]: IQuadrantValue[];
  [Position.Fourth]: IQuadrantValue[];
}

enum Position {
  First,
  Second,
  Third,
  Fourth,
}

import tbData from './index.json'

export default class Teeth {

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  private values: IPropValue[] | null
  private quadrant: IQuadrant | null

  private gap: number

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const dpr = window.devicePixelRatio
    canvas.width = parseInt(canvas.style.width) * dpr
    canvas.height = parseInt(canvas.style.height) * dpr
    ctx.scale(dpr, dpr)
    this.canvas = canvas
    this.ctx = ctx
    this.ctx.font = '14px yahei'

    this.values = null
    this.quadrant = null
    this.gap = 2
  }

  attr(props: IProps) {
    this.values = props.values
  }

  draw() {
    // 清空画布
    this._clearDraw()
    this._handleData()
    console.log(this.quadrant)
    if (!this.quadrant) return
    const p1 = this.quadrant[Position.First]
    const p2 = this.quadrant[Position.Second]
    const p3 = this.quadrant[Position.Third]
    const p4 = this.quadrant[Position.Fourth]
    // 绘制坐标轴
    const w1 = this._getTextWidth(p1)
    const w2 = this._getTextWidth(p2)
    const w3 = this._getTextWidth(p3)
    const w4 = this._getTextWidth(p4)
    const cLeftWidth = w1 > w4 ? w1 + this.gap : w4 + this.gap
    const cRightWidth = w2 > w3 ? w2 + this.gap : w3 + this.gap
    const cWidth = cLeftWidth + cRightWidth
    const cHeight = 50
    this.ctx.fillRect(0, cHeight / 2, cWidth, 1)
    this.ctx.fillRect(cLeftWidth, 0, 1, cHeight)
    // 绘制元素
    let curX = 0
    let curY = cHeight / 2
    // 第一象限
    curX = cLeftWidth - w1
    const curXY1 = this._drawText(p1, curX, curY, 1.2, 1.7)
    curX = curXY1.curX
    curY = curXY1.curY
    // 第二象限
    curX = cLeftWidth + this.gap
    const curXY2 = this._drawText(p2, curX, curY, 1.2, 1.7)
    curX = curXY2.curX
    curY = curXY2.curY
    // 第三象限
    curX = cLeftWidth + this.gap
    curY = cHeight
    const curXY3 = this._drawText(p3, curX, curY, 1.1, 1.3)
    curX = curXY3.curX
    curY = curXY3.curY
    // 第四象限
    curX = cLeftWidth - w4
    curY = cHeight
    const curXY4 = this._drawText(p4, curX, curY, 1.1, 1.3)
    curX = curXY4.curX
    curY = curXY4.curY
  }

  snapshot() {
    const image = new Image()
    image.src = this.canvas.toDataURL("image/png")
    return image
  }

  _drawText(p1: IQuadrantValue[], curX: number, curY: number, textCoefficient: number, supCoefficient: number) {
    p1.forEach(p => {
      this.ctx.fillText(p.display, curX, curY / textCoefficient)
      const textW = this.ctx.measureText(p.display).width
      curX += textW
      this.ctx.save()
      this.ctx.font = '10px yahei'
      this.ctx.fillText(p.surface, curX, curY / supCoefficient)
      const supW = this.ctx.measureText(p.surface).width
      curX = curX + supW + this.gap
      this.ctx.restore()
    })
    return { curX, curY }
  }

  _clearDraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  _getTextWidth(quadrantVals: IQuadrantValue[]) {
    let width = 0
    quadrantVals.forEach(p => {
      const text = p.display
      const textWidth = this.ctx.measureText(text).width
      width += textWidth
      this.ctx.save()
      this.ctx.font = '10px yahei'
      const sup = p.surface
      const supWidth = this.ctx.measureText(sup).width
      width += supWidth
      this.ctx.restore()
      width += this.gap
    })
    return width
  }

  _handleData() {
    if (!this.values) return
    const tbValueList = this.values.filter((item) => !!item.emrepValue)
    const teeth = [...tbData.permanentTeeth, ...tbData.deciduousTeeth]
    // 筛选出每个象限的值
    let quadrant: IQuadrant = [[], [], [], []]
    tbValueList.forEach((tbValue) => {
      const tooth = teeth.find((t) => t.conceptId === tbValue.cepConceptId)
      if (!tooth) return
      // 处理每颗牙齿数据
      const surface = tbValue.emrepValue
        .split(",")
        .map((v) => {
          const tbSurface = tbData.teethSurface.find((t) => t.valueId === v)
          return tbSurface ? tbSurface.display : null
        })
        .filter(Boolean)
        .join("")
      const tbItemValue = { ...tbValue, ...tooth, surface }
      const index: Position = tooth.quadrant - 1
      quadrant[index].push(tbItemValue)
    })
    // 象限排序：0-3倒序，1-2正序
    quadrant[0].sort((a, b) => b.seq - a.seq)
    quadrant[3].sort((a, b) => b.seq - a.seq)
    quadrant[1].sort((a, b) => a.seq - b.seq)
    quadrant[2].sort((a, b) => a.seq - b.seq)
    this.quadrant = quadrant
  }

}