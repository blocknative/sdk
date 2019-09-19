import { validateEvent } from "./validation"
import { sendMessage } from "./messages"

function event(eventObj) {
  validateEvent(eventObj)
  sendMessage(eventObj)
}

export default event
