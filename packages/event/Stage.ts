import EventSimulator from "./simulator";
import { rgbaToId } from "./utils";
import { ActionType, Shape } from "./types";

export default class Stage {
  private canvas: HTMLCanvasElement
  private osCanvas: OffscreenCanvas;
  private ctx: CanvasRenderingContext2D
  private osCtx: OffscreenCanvasRenderingContext2D;
  private dpr: number
  private shapeIds: Set<string>
  private shapes: Set<Shape>
  private eventSimulator: EventSimulator

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio;
    canvas.width = parseInt(canvas.style.width) * dpr;
    canvas.height = parseInt(canvas.style.height) * dpr;

    this.canvas = canvas
    this.osCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    // @ts-ignore
    this.ctx = this.canvas.getContext('2d')
    // @ts-ignore
    this.osCtx = this.osCanvas.getContext('2d');
    this.ctx.scale(dpr, dpr)
    this.osCtx.scale(dpr, dpr);

    this.dpr = dpr

    this.canvas.addEventListener('mousedown', this.handleCreator(ActionType.Down))
    this.canvas.addEventListener('mouseup', this.handleCreator(ActionType.Up))
    this.canvas.addEventListener('mousemove', this.handleCreator(ActionType.Move))

    this.shapeIds = new Set()
    this.shapes = new Set()
    this.eventSimulator = new EventSimulator()

  }

  add(shape: Shape) {
    const id = shape.getId();
    this.eventSimulator.addListeners(id, shape.getListeners())
    this.shapeIds.add(id)
    this.shapes.add(shape)
    shape.bind(this.ctx, this.osCtx, this.update.bind(this))
    shape.draw()
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.osCtx.clearRect(0, 0, this.osCanvas.width, this.osCanvas.height)
    this.shapes.forEach(shape => shape.draw())
  }

  private handleCreator = (type: ActionType) => (evt: MouseEvent) => {
    const x = evt.offsetX
    const y = evt.offsetY
    const id = this.hitJudge(x, y)
    this.eventSimulator.addAction({ type, id }, evt)
  }

  private hitJudge(x: number, y: number): string | null {
    const rgba = Array.from(this.osCtx.getImageData(x * this.dpr, y * this.dpr, 1, 1).data)
    const id = rgbaToId(rgba as [number, number, number, number]);
    return this.shapeIds.has(id) ? id : null
  }

}