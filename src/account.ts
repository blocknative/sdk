import { createEmitter } from './utilities'
import { Emitter, Ac } from './interfaces'

function account(
  this: any,
  address: string
): { emitter: Emitter; details: { address: string } } {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  // lowercase the address if Ethereum
  address = this._system === 'ethereum' ? address.toLowerCase() : address

  // create emitter for transaction
  const emitter: Emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = 'watch'

  const existingAddressWatcher = this._watchedAccounts.find(
    (ac: Ac) => ac.address === address
  )

  if (existingAddressWatcher) {
    // add to existing emitters array
    existingAddressWatcher.emitters.push(emitter)
  } else {
    // put in accounts queue
    this._watchedAccounts.push({
      address,
      emitters: [emitter]
    })
  }

  // logEvent to server
  this._sendMessage({
    eventCode,
    categoryCode: 'accountAddress',
    account: {
      address
    }
  })

  return {
    emitter,
    details: {
      address
    }
  }
}

export default account
