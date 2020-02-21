import { createEmitter } from './utilities'
import { session } from './state'
import { sendMessage } from './messages'

import { Emitter, Ac } from './interfaces'
import { validateAccount } from './validation'

function account(
  clientIndex: number,
  address: string
): { emitter: Emitter; details: { address: string } } {
  validateAccount(clientIndex, address)

  // lowercase the address
  address = address.toLowerCase()

  // create emitter for transaction
  const emitter: Emitter = createEmitter()

  // create eventCode for transaction
  const eventCode: string = 'accountAddress'

  const existingAddressWatcher = session.clients[clientIndex].accounts.find(
    (ac: Ac) => ac.address === address
  )

  if (existingAddressWatcher) {
    // add to existing emitters array
    existingAddressWatcher.emitters.push(emitter)
  } else {
    // put in accounts queue
    session.clients[clientIndex].accounts.push({
      address,
      emitters: [emitter]
    })
  }

  // logEvent to server
  sendMessage({
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
