import {
  serverEcho,
  last,
  networkName,
  wait,
  jsonPreserveUndefined
} from './utilities'
import { version } from '../package.json'
import { Ac, Tx, Emitter, EventObject, TransactionHandler } from './interfaces'
import { DEFAULT_RATE_LIMIT_RULES, QUEUE_LIMIT } from './defaults'

export function sendMessage(this: any, msg: EventObject) {
  if (this._queuedMessages.length > QUEUE_LIMIT) {
    throw new Error(`Queue limit of ${QUEUE_LIMIT} messages has been reached.`)
  }

  this._queuedMessages.push(createEventLog.bind(this)(msg))

  if (!this._processingQueue) {
    this._processQueue()
  }
}

export async function processQueue(this: any) {
  this._processingQueue = true

  if (!this._connected) {
    await waitForConnectionOpen.bind(this)()
  }

  while (this._queuedMessages.length > 0) {
    // small wait to allow response from server to take affect
    await wait(1)

    if (this._waitToRetry !== null) {
      // have been rate limited so wait
      await this._waitToRetry
      this._waitToRetry = null
    }

    const msg = this._queuedMessages.shift()

    const delay = (this._limitRules.duration / this._limitRules.points) * 1000
    await wait(delay)
    this._socket.send(msg)
  }

  this._processingQueue = false
  this._limitRules = DEFAULT_RATE_LIMIT_RULES
}

export function handleMessage(this: any, msg: { data: string }): void {
  const {
    status,
    reason,
    event,
    connectionId,
    serverVersion,
    retryMs,
    limitRules,
    blockedMsg
  } = JSON.parse(msg.data)

  if (connectionId) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this._storageKey, connectionId)
    }

    this._connectionId = connectionId
  }

  // handle any errors from the server
  if (status === 'error') {
    if (reason.includes('ratelimit') && !reason.includes('IP ratelimited')) {
      this._waitToRetry = wait(retryMs)
      this._limitRules = limitRules

      // add blocked msg to the front of the queue
      blockedMsg && this._queuedMessages.unshift(blockedMsg)
      return
    }

    if (reason.includes('not a valid API key')) {
      if (this._onerror) {
        this._onerror({ message: reason })
        return
      } else {
        throw new Error(reason)
      }
    }

    if (reason.includes('network not supported')) {
      if (this._onerror) {
        this._onerror({ message: reason })
        return
      } else {
        throw new Error(reason)
      }
    }

    if (reason.includes('maximum allowed amount')) {
      if (this._onerror) {
        this._onerror({ message: reason })
        return
      } else {
        throw new Error(reason)
      }
    }

    // handle bitcoin txid error
    if (reason.includes('invalid txid')) {
      const reason = `${event.transaction.txid} is an invalid txid`
      if (this._onerror) {
        this._onerror({ message: reason, transaction: event.transaction.txid })
        return
      } else {
        throw new Error(reason)
      }
    }

    // handle ethereum transaction hash error
    if (reason.includes('invalid hash')) {
      const reason = `${event.transaction.hash} is an invalid transaction hash`

      if (this._onerror) {
        this._onerror({ message: reason, transaction: event.transaction.hash })
        return
      } else {
        throw new Error(reason)
      }
    }

    // handle general address error
    if (reason.includes('invalid address')) {
      const reason = `${event.account.address} is an invalid address`

      if (this._onerror) {
        this._onerror({ message: reason, account: event.account.address })
        return
      } else {
        throw new Error(reason)
      }
    }

    // handle bitcoin specific address error
    if (reason.includes('not a valid Bitcoin')) {
      if (this._onerror) {
        this._onerror({ message: reason, account: event.account.address })
        return
      } else {
        throw new Error(reason)
      }
    }

    // handle ethereum specific address error
    if (reason.includes('not a valid Ethereum')) {
      if (this._onerror) {
        this._onerror({ message: reason, account: event.account.address })
        return
      } else {
        throw new Error(reason)
      }
    }

    // handle config error
    if (event && event.config) {
      const configuration = this._configurations.get(event.config.scope)

      if (configuration && configuration.subscription) {
        configuration.subscription.error(reason)
      }

      return
    }

    // throw error that comes back from the server without formatting the message
    if (this._onerror) {
      this._onerror({ message: reason })
      return
    } else {
      throw new Error(reason)
    }
  }

  if (event && event.config) {
    const configuration = this._configurations.get(event.config.scope)

    if (configuration && configuration.subscription) {
      configuration.subscription.next()
    }
  }

  if (event && event.transaction) {
    const {
      transaction,
      eventCode,
      contractCall,
      timeStamp,
      blockchain: { system, network }
    } = event

    // flatten in to one object
    const newState =
      this._system === 'ethereum'
        ? {
            ...transaction,
            serverVersion,
            eventCode,
            timeStamp,
            system,
            network,
            contractCall
          }
        : {
            ...transaction,
            serverVersion,
            eventCode,
            timeStamp,
            system,
            network
          }

    // ignore server echo and unsubscribe messages
    if (serverEcho(eventCode) || transaction.status === 'unsubscribed') {
      return
    }

    // replace originalHash to match webhook API
    if (newState.originalHash) {
      newState.replaceHash = newState.originalHash
      delete newState.originalHash
    }

    // replace status to match webhook API
    if (eventCode === 'txSpeedUp' && newState.status !== 'speedup') {
      newState.status = 'speedup'
    }

    // replace status to match webhook API
    if (eventCode === 'txCancel' && newState.status !== 'cancel') {
      newState.status = 'cancel'
    }

    // handle change of hash in speedup and cancel events
    if (eventCode === 'txSpeedUp' || eventCode === 'txCancel') {
      this._watchedTransactions = this._watchedTransactions.map((tx: Tx) => {
        if (tx.hash === transaction.replaceHash) {
          // reassign hash parameter in transaction queue to new hash or txid
          tx.hash = transaction.hash || transaction.txid
        }
        return tx
      })
    }

    const watchedAddress =
      transaction.watchedAddress && this._system === 'ethereum'
        ? transaction.watchedAddress.toLowerCase()
        : transaction.watchedAddress

    if (watchedAddress) {
      const accountObj = this._watchedAccounts.find(
        (ac: Ac) => ac.address === watchedAddress
      )

      const accountEmitterResult = accountObj
        ? last(
            accountObj.emitters.map((emitter: Emitter) =>
              emitter.emit(newState)
            )
          )
        : false

      const configuration = this._configurations.get(watchedAddress)

      const configurationEmitterResult =
        configuration &&
        configuration.emitter &&
        configuration.emitter.emit(newState)

      this._transactionHandlers.forEach((handler: TransactionHandler) =>
        handler({
          transaction: newState,
          emitterResult: accountEmitterResult || configurationEmitterResult
        })
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

export function createEventLog(this: any, msg: EventObject): string {
  return JSON.stringify(
    {
      timeStamp: new Date().toISOString(),
      dappId: this._dappId,
      version,
      blockchain: {
        system: this._system,
        network: networkName(this._system, this._networkId) || 'local'
      },
      ...msg
    },
    msg.categoryCode === 'configs' ? jsonPreserveUndefined : undefined
  )
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
