import Base from "./Base";
import { idToRgba } from "../utils";
import { CircleAttr, CircleProps } from "../types";

export default class Circle extends Base {

  private lastProps: CircleProps | null

  constructor(props: CircleProps) {
    super()
    this.lastProps = props
  }

  draw() {
    if (!this.ctx || !this.osCtx || !this.lastProps) return
    this.createShape(this.ctx, this.lastProps)

    const [r, g, b, a] = idToRgba(this.id);
    this.createShape(this.osCtx, {
      ...this.lastProps,
      strokeColor: `rgba(${r},${g},${b},${a})`,
      fillColor: `rgba(${r}, ${g}, ${b}, ${a})`
    })
  }

  attr(props: CircleAttr) {
    if (!this.ctx || !this.osCtx || !props || !this.lastProps) return
    this.lastProps = { ...this.lastProps, ...props }
    this.update()
  }

  createShape(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, prop: CircleProps) {
    const { x, y, radius, strokeColor, strokeWidth, fillColor } = prop
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = strokeColor || '#fff'
    ctx.lineWidth = strokeWidth || 1
    ctx.fillStyle = fillColor || '#000'
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

}