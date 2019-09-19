import { validateEvent } from "./validation"
import { sendMessage } from "./websockets"

function event(eventObj) {
  validateEvent(eventObj)
  sendMessage(eventObj)
}

export default event
