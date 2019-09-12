import { validateAddress } from "./validation"
import { createEmitter } from "./utilities"
import { session } from "./state"
import { sendMessage } from "./messages"

function account(address) {
  validateAddress(address)

  // create emitter for transaction
  const emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = "accountAddress"

  // put in queue
  session.accounts.push({
    address,
    emitter
  })

  // logEvent to server
  sendMessage({
    eventCode,
    categoryCode: "watch",
    account: {
      address
    }
  })

  return {
    emitter,
    details: {
      address
    }
  }
}

export default account
