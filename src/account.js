import { validateAddress } from "./validation"
import { createEmitter } from "./utilities"

function account(address) {
  validateAddress(address)

  // create emitter for transaction
  const emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = "accountAddress"

  // put in queue
  this.accounts.push({
    address,
    emitter
  })

  // logEvent to server
  this.sendMessage({
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
