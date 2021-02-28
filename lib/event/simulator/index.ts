import { Listener, EventNames, Action, ActionType } from '../index'

export default class EventSimulator {
  private listenersMap: {
    [id: string]: {
      [eventName: string]: Listener[]
    }
  }

  private lastDownId: string | null

  private lastMoveId: string | null

  constructor() {
    this.listenersMap = {}
    this.lastDownId = null
    this.lastMoveId = null
  }

  addAction(action: Action, evt: MouseEvent) {
    const { id, type } = action

    // mousemove
    if (type === ActionType.Move) {
      this.fire(id, EventNames.mousemove, evt)
    }

    // mouseover
    // mouseenter
    if (type === ActionType.Move && (!this.lastMoveId || this.lastMoveId !== id)) {
      this.fire(id, EventNames.mouseenter, evt)
      this.fire(id, EventNames.mouseover, evt)
    }

    // mouseleave
    // mouseout
    if (type === ActionType.Move && (this.lastMoveId && !id)) {
      this.fire(this.lastMoveId, EventNames.mouseleave, evt)
      this.fire(this.lastMoveId, EventNames.mouseout, evt)
    }

    // mousedown
    if (type === ActionType.Down) {
      this.fire(id, EventNames.mousedown, evt);
    }

    // mouseup
    if (type === ActionType.Up) {
      this.fire(id, EventNames.mouseup, evt);
    }

    // click
    if (type === ActionType.Up && this.lastDownId === id) {
      this.fire(id, EventNames.click, evt);
    }

    if (type === ActionType.Move) {
      this.lastMoveId = action.id
    } else if (type === ActionType.Down) {
      this.lastDownId = action.id
    }

  }

  addListeners(id: string, listeners: { [eventName: string]: Listener[] }) {
    this.listenersMap[id] = listeners
  }

  fire(id: string | null, eventName: EventNames, evt: MouseEvent) {
    if (!id) return
    if (this.listenersMap[id] && this.listenersMap[id][eventName]) {
      this.listenersMap[id][eventName].forEach((listener) => listener(evt));
    }
  }

}