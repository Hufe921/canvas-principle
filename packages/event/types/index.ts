export interface Listener {
  (evt: MouseEvent): void
}

export interface CircleProps {
  x: number;
  y: number;
  radius: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

export interface CircleAttr {
  x?: number;
  y?: number;
  radius?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

export interface RectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

export interface RectAttr {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

export interface Shape {
  bind(ctx: CanvasRenderingContext2D, osCtx: OffscreenCanvasRenderingContext2D, update: Function): void
  draw(): void
  attr(props: CircleAttr | RectAttr): void
  on(name: string, listener: Listener): void;
  getListeners(): { [name: string]: Listener[] }
  getId(): string
}

export interface Action {
  type: ActionType;
  id: string | null;
}

export enum EventNames {
  click = 'click',
  mousedown = 'mousedown',
  mousemove = 'mousemove',
  mouseup = 'mouseup',
  mouseenter = 'mouseenter',
  mouseleave = 'mouseleave',
  mouseover = 'mouseover',
  mouseout = 'mouseout',
}

export enum ActionType {
  Down = 'DOWN',
  Up = 'Up',
  Move = 'MOVE',
}
