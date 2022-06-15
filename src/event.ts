import SDK from '.'
import { EventObject } from './types'

function event(this: SDK, eventObj: EventObject): void {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  this._sendMessage(eventObj)
}

export default event
