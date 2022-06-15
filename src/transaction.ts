import { createEmitter } from './utilities'
import { Emitter, TransactionHandler } from './types'
import SDK from '.'

function transaction(this: SDK, hash: string, id?: string) {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  // create startTime for transaction
  const startTime: number = Date.now()

  // create emitter for transaction
  const emitter: Emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = 'txSent'

  // put in queue
  this.watchedTransactions.push({
    hash,
    emitter
  })

  const transactionId = this._system === 'ethereum' ? { hash } : { txid: hash }

  const transaction = {
    ...transactionId,
    id: id || hash,
    startTime,
    status: 'sent'
  }

  const newState = {
    ...transaction,
    eventCode
  }

  // logEvent to server
  this._sendMessage({
    eventCode,
    categoryCode: 'activeTransaction',
    transaction
  })

  const transactionObj = {
    details: newState,
    emitter
  }

  function emitState(this: any) {
    const emitterResult = emitter.emit(newState)
    this._transactionHandlers.forEach((handler: TransactionHandler) =>
      handler({ transaction: newState, emitterResult })
    )
  }

  // emit after delay to allow for listener to be registered
  setTimeout(emitState.bind(this), 5)

  return transactionObj
}

export default transaction
