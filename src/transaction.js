import { validateHash, validateId } from "./validation"
import { createEmitter } from "./utilities"

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
  this.transactions.push({
    hash,
    emitter
  })

  // logEvent to server
  this.sendMessage({
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
