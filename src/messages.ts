import { serverEcho, last, networkName } from './utilities'
import { version } from '../package.json'
import { Ac, Tx, Emitter, EventObject, TransactionHandler } from './interfaces'

export async function sendMessage(this: any, msg: EventObject) {
  if (!this._connected) {
    await waitForConnectionOpen.bind(this)()
  }

  this._socket.send(createEventLog.bind(this)(msg))
}

function waitForConnectionOpen(this: any) {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (this._connected) {
        setTimeout(resolve, 100)
        clearInterval(interval)
      }
    })
  })
}

export function handleMessage(this: any, msg: { data: string }): void {
  const { status, reason, event, connectionId } = JSON.parse(msg.data)

  if (connectionId) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this._storageKey, connectionId)
    }

    this._connectionId = connectionId
  }

  // handle any errors from the server
  if (status === 'error') {
    if (reason.includes('not a valid API key')) {
      const errorObj = new Error(reason)
      throw errorObj
    }

    if (reason.includes('network not supported')) {
      const errorObj = new Error(reason)
      throw errorObj
    }

    if (reason.includes('maximum allowed amount')) {
      const errorObj = new Error(reason)
      throw errorObj
    }
  }

  if (event && event.transaction) {
    const { transaction, eventCode, contractCall } = event

    // flatten in to one object
    const newState = { ...transaction, eventCode, contractCall }

    // ignore server echo and unsubscribe messages
    if (serverEcho(eventCode) || transaction.status === 'unsubscribed') {
      return
    }

    // handle change of hash in speedup and cancel events
    if (eventCode === 'txSpeedUp' || eventCode === 'txCancel') {
      this._watchedTransactions = this._watchedTransactions.map((tx: Tx) => {
        if (tx.hash === transaction.originalHash) {
          // reassign hash parameter in transaction queue to new hash
          tx.hash = transaction.hash
        }
        return tx
      })
    }

    const watchedAddress =
      transaction.watchedAddress && transaction.watchedAddress.toLowerCase()

    if (watchedAddress) {
      const accountObj = this._watchedAccounts.find(
        (ac: Ac) => ac.address === watchedAddress
      )
      const emitterResult = accountObj
        ? last(
            accountObj.emitters.map((emitter: Emitter) =>
              emitter.emit(newState)
            )
          )
        : false

      this._transactionHandlers.forEach((handler: TransactionHandler) =>
        handler({ transaction: newState, emitterResult })
      )
    } else {
      const transactionObj = this._watchedTransactions.find(
        (tx: Tx) => tx.hash === transaction.hash
      )
      const emitterResult =
        transactionObj && transactionObj.emitter.emit(newState)

      this._transactionHandlers.forEach((handler: TransactionHandler) =>
        handler({ transaction: newState, emitterResult })
      )
    }
  }
}

function createEventLog(this: any, msg: EventObject): string {
  return JSON.stringify({
    timeStamp: new Date(),
    dappId: this._dappId,
    version,
    blockchain: {
      system: 'ethereum',
      network: networkName(this._networkId)
    },
    ...msg
  })
}
