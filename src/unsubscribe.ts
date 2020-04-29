import { validateUnsubscribe, isAddress, validTxHash } from './validation'
import { Ac, Tx } from './interfaces'

function unsubscribe(this: any, addressOrHash: string) {
  validateUnsubscribe(addressOrHash)

  if (isAddress(addressOrHash)) {
    const normalizedAddress = addressOrHash.toLowerCase()
    // remove address from accounts
    this._watchedAccounts = this._watchedAccounts.filter(
      (ac: Ac) => ac.address !== addressOrHash
    )

    // logEvent to server
    this._sendMessage({
      eventCode: 'accountAddress',
      categoryCode: 'unwatch',
      account: {
        address: normalizedAddress
      }
    })
  } else if (validTxHash(addressOrHash)) {
    // remove transaction from transactions
    this._watchedTransactions = this._watchedTransactions.filter(
      (tx: Tx) => tx.hash !== addressOrHash
    )

    // logEvent to server
    this._sendMessage({
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
