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
      throw new Error(reason)
    }

    if (reason.includes('network not supported')) {
      throw new Error(reason)
    }

    if (reason.includes('maximum allowed amount')) {
      throw new Error(reason)
    }

    if (reason.includes('invalid txid')) {
      throw new Error(`${event.transaction.txid} is an invalid txid`)
    }

    if (reason.includes('invalid hash')) {
      throw new Error(
        `${event.transaction.hash} is an invalid transaction hash`
      )
    }

    if (reason.includes('invalid address')) {
      throw new Error(`${event.account.address} is an invalid address`)
    }

    // throw error that comes back from the server without formatting the message
    throw new Error(reason)
  }

  if (event && event.transaction) {
    const { transaction, eventCode, contractCall } = event

    // flatten in to one object
    const newState =
      this._system === 'ethereum'
        ? { ...transaction, eventCode, contractCall }
        : { ...transaction, eventCode }

    // ignore server echo and unsubscribe messages
    if (serverEcho(eventCode) || transaction.status === 'unsubscribed') {
      return
    }

    // handle change of hash in speedup and cancel events
    if (eventCode === 'txSpeedUp' || eventCode === 'txCancel') {
      this._watchedTransactions = this._watchedTransactions.map((tx: Tx) => {
        if (tx.hash === transaction.originalHash) {
          // reassign hash parameter in transaction queue to new hash or txid
          tx.hash = transaction.hash || transaction.txid
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
        (tx: Tx) => tx.hash === transaction.hash || transaction.txid
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
      system: this._system,
      network: networkName(this._system, this._networkId)
    },
    ...msg
  })
}
