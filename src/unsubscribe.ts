import { sendMessage } from './messages'
import { removeAccount, removeTransaction } from './utilities'

import { validateUnsubscribe, isAddress, validTxHash } from './validation'

function unsubscribe(clientIndex: number, addressOrHash: string) {
  validateUnsubscribe(clientIndex, addressOrHash)

  if (isAddress(addressOrHash)) {
    const normalizedAddress = addressOrHash.toLowerCase()
    // remove address from accounts
    removeAccount(clientIndex, normalizedAddress)

    // logEvent to server
    sendMessage({
      eventCode: 'accountAddress',
      categoryCode: 'unwatch',
      account: {
        address: normalizedAddress
      }
    })
  } else if (validTxHash(addressOrHash)) {
    // remove transaction from transactions
    removeTransaction(clientIndex, addressOrHash)

    // logEvent to server
    sendMessage({
      eventCode: 'activeTransaction',
      categoryCode: 'unwatch',
      transaction: {
        hash: addressOrHash,
        id: addressOrHash,
        status: 'unsubscribed'
      }
    })
  } else {
    throw new Error(
      `Error trying to unsubscribe ${addressOrHash}: not a valid address or transaction hash`
    )
  }
}

export default unsubscribe
