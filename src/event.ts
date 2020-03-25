import { EventObject } from './interfaces'
import { validateEvent } from './validation'

function event(this: any, eventObj: EventObject): void {
  validateEvent(eventObj)
  this._sendMessage(eventObj)
}

export default event
