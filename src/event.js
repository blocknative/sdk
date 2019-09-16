import { validateEvent } from "./validation"

function event(eventObj) {
  validateEvent(eventObj)
  this.sendMessage(eventObj)
}

export default event
