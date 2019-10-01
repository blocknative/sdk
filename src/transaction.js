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

  // emit after delay to allow for listener to be registered
  setTimeout(() => {
    const emitterResult = emitter.emit(newState)

    session.transactionListeners &&
      session.transactionListeners.forEach(listener =>
        listener({ transaction: newState, emitterResult })
      )
  }, 5)

  return transactionObj
}

export default transaction
