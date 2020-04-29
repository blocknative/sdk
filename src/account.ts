import { createEmitter } from './utilities'
import { Emitter, Ac } from './interfaces'
import { validateAccount } from './validation'

function account(
  this: any,
  address: string
): { emitter: Emitter; details: { address: string } } {
  validateAccount(address)

  // lowercase the address
  address = address.toLowerCase()

  // create emitter for transaction
  const emitter: Emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = 'accountAddress'

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
    categoryCode: 'watch',
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
