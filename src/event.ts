import { sendMessage } from './messages'

import { EventObject } from './interfaces'
import { validateEvent } from './validation'

function event(eventObj: EventObject): void {
  validateEvent(eventObj)
  sendMessage(eventObj)
}

export default event
