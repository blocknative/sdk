import { EventObject } from './interfaces'

function event(this: any, eventObj: EventObject): void {
  this._sendMessage(eventObj)
}

export default event
