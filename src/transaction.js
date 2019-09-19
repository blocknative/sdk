import { validateHash, validateId } from "./validation"
import { createEmitter } from "./utilities"
import { session } from "./state"
import { sendMessage } from "./messages"

function transaction(hash, id) {
  validateHash(hash)

  if (id) {
    validateId(id)
  }

  // create startTime for transaction
  const startTime = Date.now()

  // create emitter for transaction
  const emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = "txSent"

  // put in queue
  session.transactions.push({
    hash,
    emitter
  })

  // logEvent to server
  sendMessage({
    eventCode,
    categoryCode: "activeTransaction",
    transaction: {
      hash,
      id: id || hash,
      startTime,
      status: "sent"
    }
  })

  const transactionObj = {
    details: {
      hash,
      startTime,
      eventCode
    },
    emitter
  }

  return transactionObj
}

export default transaction
