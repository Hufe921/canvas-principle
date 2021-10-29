import { createId } from '../utils'
import { Shape, Listener, EventNames, CircleAttr, RectAttr } from '../types'

export default class Base implements Shape {

  private listeners: { [eventName: string]: Listener[] }
  public id: string
  public ctx: CanvasRenderingContext2D | null
  public osCtx: OffscreenCanvasRenderingContext2D | null
  public update: Function

  constructor() {
    this.listeners = {}
    this.id = createId()
    this.ctx = null
    this.osCtx = null
    this.update = () => { }
  }

  bind(ctx: CanvasRenderingContext2D, osCtx: OffscreenCanvasRenderingContext2D, update: Function): void {
    this.ctx = ctx
    this.osCtx = osCtx
    this.update = update
  }

  draw(): void {
    throw new Error('Method not implemented.');
  }

  attr(_props: CircleAttr | RectAttr): void {
    throw new Error('Method not implemented.');
  }

  on(eventName: EventNames, listener: Listener): void {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(listener)
    } else {
      this.listeners[eventName] = [listener]
    }
  }

  getListeners(): { [name: string]: Listener[] } {
    return this.listeners
  }

  getId(): string {
    return this.id
  }

}