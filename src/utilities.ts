import { Emitter, NotificationObject } from './types'
import { networks } from './defaults'

export function createEmitter(): Emitter {
  return {
    listeners: {},
    on: function (eventCode, listener) {
      // check if valid eventCode
      switch (eventCode) {
        case 'txSent':
        case 'txPool':
        case 'txConfirmed':
        case 'txSpeedUp':
        case 'txCancel':
        case 'txFailed':
        case 'txDropped':
        case 'txRequest':
        case 'nsfFail':
        case 'txRepeat':
        case 'txAwaitingApproval':
        case 'txConfirmReminder':
        case 'txSendFail':
        case 'txError':
        case 'txUnderPriced':
        case 'txPoolSimulation':
        case 'all':
          break
        default:
          throw new Error(
            `${eventCode} is not a valid event code, for a list of valid event codes see: https://docs.blocknative.com/notify-sdk#event-codes`
          )
      }

      // check that listener is a function
      if (typeof listener !== 'function') {
        throw new Error('Listener must be a function')
      }

      // add listener for the eventCode
      this.listeners[eventCode] = listener
    },
    off: function (eventCode) {
      delete this.listeners[eventCode]
    },
    emit: function (state) {
      if (this.listeners[state.eventCode]) {
        return this.listeners[state.eventCode](state)
      }

      if (this.listeners.all) {
        return this.listeners.all(state)
      }
    }
  }
}

export function networkName(blockchain: string, id: number): string {
  return networks[blockchain][id]
}

export function serverEcho(eventCode: string): boolean {
  switch (eventCode) {
    case 'txRequest':
    case 'nsfFail':
    case 'txRepeat':
    case 'txAwaitingApproval':
    case 'txConfirmReminder':
    case 'txSendFail':
    case 'txError':
    case 'txUnderPriced':
    case 'txSent':
      return true
    default:
      return false
  }
}

export function last(
  arr: (undefined | boolean | NotificationObject)[]
): undefined | boolean | NotificationObject {
  return arr.reverse()[0]
}

// isAddress and isTxid are not meant to perform real validation,
// just needs to work out if it is an address or a transaction id
// the server will do more thorough validation
export function isAddress(blockchain: string, addressOrHash: string) {
  switch (blockchain) {
    case 'ethereum':
      return addressOrHash.length === 42
    case 'bitcoin':
      return addressOrHash.length !== 64
    default:
      return false
  }
}

export function isTxid(blockchain: string, addressOrHash: string) {
  switch (blockchain) {
    case 'ethereum':
      return addressOrHash.length === 66
    case 'bitcoin':
      return addressOrHash.length === 64
    default:
      return false
  }
}

export function wait(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

export const jsonPreserveUndefined = (k: any, v: any) =>
  v === undefined ? 'undefined' : v

/**
 * Tests if LocalStorage may be used. Accounts for environments where
 * LocalStorage is not supported, as well as those where it is blocked.
 *
 * @returns `true` if LocalStorage is supported and accessible, `false` otherwise.
 */
export function isLocalStorageAvailable(): boolean {
  const isSupported = typeof window !== 'undefined' && 'localStorage' in window

  if (isSupported) {
    const testKey = '__testLocalStorage'
    try {
      window.localStorage.setItem(testKey, '1')
      window.localStorage.removeItem(testKey)
      return true
    } catch (err) {
      return false
    }
  }

  return false
}
