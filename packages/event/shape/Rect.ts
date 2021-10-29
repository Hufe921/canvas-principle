import Base from "./Base";
import { idToRgba } from "../utils";
import { RectAttr, RectProps } from "../types";

export default class Rect extends Base {

  public lastProps: RectProps

  constructor(props: RectProps) {
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

  attr(props: RectAttr) {
    if (!this.ctx || !this.osCtx || !props || !this.lastProps) return
    this.lastProps = { ...this.lastProps, ...props }
    this.update()
  }

  createShape(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, prop: RectProps) {
    const { x, y, width, height, strokeColor, strokeWidth, fillColor } = prop
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = strokeColor || '#fff'
    ctx.lineWidth = strokeWidth || 1
    ctx.fillStyle = fillColor || '#000'
    ctx.rect(x, y, width, height)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

}