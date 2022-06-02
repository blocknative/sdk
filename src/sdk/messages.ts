import { version } from '../../package.json'
import { Ac, Tx, Emitter, EventObject, TransactionHandler } from '../types'
import { DEFAULT_RATE_LIMIT_RULES, QUEUE_LIMIT } from '../defaults'
import { simulations$ } from '../streams'
import SDK from '.'

import {
  serverEcho,
  last,
  networkName,
  wait,
  jsonPreserveUndefined,
  isLocalStorageAvailable
} from '../utilities'

export function sendMessage(this: SDK, msg: EventObject) {
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
    blockedMsg,
    dispatchTimestamp
  } = JSON.parse(msg.data)

  if (connectionId) {
    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(this._storageKey, connectionId)
    }

    this._connectionId = connectionId
  }

  // handle any errors from the server
  if (status === 'error') {
    if (
      reason.includes('ratelimit') &&
      !reason.match(/IP (PendingSimulation|Notification) ratelimit reached/)
    ) {
      this._waitToRetry = wait(retryMs)
      this._limitRules = limitRules

      // add blocked msg to the front of the queue
      blockedMsg && this._queuedMessages.unshift(blockedMsg)
      return
    }

    if (reason.includes('upgrade your plan')) {
      if (this._onerror) {
        this._onerror({ message: reason })
        return
      } else {
        throw new Error(reason)
      }
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

    if (event.categoryCode === 'simulate') {
      simulations$.error(event)
      return
    }

    // handle config error
    if (event && event.config) {
      const configuration = this.configurations.get(event.config.scope)

      if (configuration && configuration.subscription) {
        configuration.subscription.error({ message: reason })
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
    const casedScope =
      this._system === 'ethereum'
        ? event.config.scope.toLowerCase()
        : event.config.scope

    const configuration = this.configurations.get(casedScope)

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
            dispatchTimestamp,
            system,
            network,
            contractCall
          }
        : {
            ...transaction,
            serverVersion,
            eventCode,
            timeStamp,
            dispatchTimestamp,
            system,
            network
          }

    // ignore server echo and unsubscribe messages
    if (serverEcho(eventCode) || transaction.status === 'unsubscribed') {
      return
    }

    // replace originalHash to match webhook API
    if (newState.originalHash) {
      newState.replaceHash = newState.hash
      newState.hash = newState.originalHash
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
      this.watchedTransactions = this.watchedTransactions.map((tx: Tx) => {
        if (tx.hash === newState.replaceHash) {
          // reassign hash parameter in transaction queue to new hash or txid
          tx.hash = transaction.hash || transaction.txid
        }
        return tx
      })
    }

    if (event && event.categoryCode === 'simulate') {
      newState.contractCall = event.transaction.contractCall
      delete newState.dispatchTimestamp
      simulations$.next(newState)
      return
    }

    const watchedAddress =
      transaction.watchedAddress && this._system === 'ethereum'
        ? transaction.watchedAddress.toLowerCase()
        : transaction.watchedAddress

    if (watchedAddress) {
      const accountObj = this.watchedAccounts.find(
        (ac: Ac) => ac.address === watchedAddress
      )

      const accountEmitterResult = accountObj
        ? last(
            accountObj.emitters.map((emitter: Emitter) =>
              emitter.emit(newState)
            )
          )
        : false

      const configuration = this.configurations.get(watchedAddress)

      const emitterResult =
        configuration && configuration.emitter
          ? configuration.emitter.emit(newState) || accountEmitterResult
          : accountEmitterResult

      this._transactionHandlers.forEach((handler: TransactionHandler) =>
        handler({
          transaction: newState,
          emitterResult
        })
      )
    } else {
      const transactionObj = this.watchedTransactions.find(
        (tx: Tx) => tx.hash === newState.hash || newState.txid
      )

      const emitterResult =
        transactionObj && transactionObj.emitter.emit(newState)

      this._transactionHandlers.forEach((handler: TransactionHandler) =>
        handler({ transaction: newState, emitterResult })
      )

      // replace the emitter hash to the replace hash on replacement txs
      if (newState.status === 'speedup' || newState.status === 'cancel') {
        this.watchedTransactions = this.watchedTransactions.map((tx: Tx) => {
          if (tx.hash === newState.hash || newState.txid) {
            return { ...tx, hash: newState.replaceHash }
          }

          return tx
        })
      }
    }
  }
}

export function createEventLog(this: any, msg: EventObject): string {
  return JSON.stringify(
    {
      timeStamp: new Date().toISOString(),
      dappId: this._dappId,
      version,
      appName: this._appName,
      appVersion: this._appVersion,
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
