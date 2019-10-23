import { createEmitter } from './utilities'
import { session } from './state'
import { sendMessage } from './messages'

import { Emitter, TransactionLog, TransactionHandler } from './interfaces'
import { validateTransaction } from './validation'

function transaction(clientIndex: number, hash: string, id: undefined | string) {
  validateTransaction(clientIndex, hash, id)

  // create startTime for transaction
  const startTime: number = Date.now()

  // create emitter for transaction
  const emitter: Emitter = createEmitter()

  // create eventCode for transaction
  const eventCode: string = 'txSent'

  const client = session.clients[clientIndex]

  // put in queue
  client.transactions.push({
    hash,
    emitter
  })

  const transaction: TransactionLog = {
    hash,
    id: id || hash,
    startTime,
    status: 'sent'
  }

  const newState = {
    ...transaction,
    eventCode
  }

  // logEvent to server
  sendMessage({
    eventCode,
    categoryCode: 'activeTransaction',
    transaction
  })

  const transactionObj = {
    details: transaction,
    emitter
  }

  // emit after delay to allow for listener to be registered
  setTimeout(() => {
    const emitterResult = emitter.emit(newState)
    client.transactionHandlers.forEach((handler: TransactionHandler) =>
      handler({ transaction: newState, emitterResult })
    )
  }, 5)

  return transactionObj
}

export default transaction
