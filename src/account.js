import { validateAddress } from "./validation"
import { createEmitter } from "./utilities"
import { session } from "./state"
import { sendMessage } from "./messages"

function account(address) {
  validateAddress(address)

  // lowercase the address
  address = address.toLowerCase()

  // create emitter for transaction
  const emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = "accountAddress"

  const existingAddressWatcher = session.accounts.find(
    account => account.address === address
  )

  if (existingAddressWatcher) {
    // add to existing emitters array
    existingAddressWatcher.emitters.push(emitter)
  } else {
    // put in accounts queue
    session.accounts.push({
      address,
      emitters: [emitter]
    })
  }

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
