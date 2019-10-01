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

  const transaction = {
    hash,
    id: id || hash,
    startTime,
    status: "sent"
  }

  const newState = {
    ...transaction,
    eventCode
  }

  const emitterResult =
    emitter.listeners[eventCode] && emitter.listeners[eventCode](newState)

  session.transactionListeners &&
    session.transactionListeners.forEach(listener =>
      listener({ transaction: newState, emitterResult })
    )

  // logEvent to server
  sendMessage({
    eventCode,
    categoryCode: "activeTransaction",
    transaction
  })

  const transactionObj = {
    details: newState,
    emitter
  }

  return transactionObj
}

export default transaction
