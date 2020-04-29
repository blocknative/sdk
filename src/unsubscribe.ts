import { Ac, Tx } from './interfaces'
import { isAddress, isTxid } from './utilities'

function unsubscribe(this: any, addressOrHash: string) {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  const address = isAddress(this._system, addressOrHash)
  const txid = isTxid(this._system, addressOrHash)

  // check if it is an address or a hash
  if (address) {
    const normalizedAddress =
      this._system === 'ethereum' ? addressOrHash.toLowerCase() : addressOrHash
    // remove address from accounts
    this._watchedAccounts = this._watchedAccounts.filter(
      (ac: Ac) => ac.address !== normalizedAddress
    )

    // logEvent to server
    this._sendMessage({
      categoryCode: 'accountAddress',
      eventCode: 'unwatch',
      account: {
        address: normalizedAddress
      }
    })
  } else if (txid) {
    // remove transaction from transactions
    this._watchedTransactions = this._watchedTransactions.filter(
      (tx: Tx) => tx.hash !== addressOrHash
    )

    // logEvent to server
    this._sendMessage({
      categoryCode: 'activeTransaction',
      eventCode: 'unwatch',
      transaction: {
        [this._system === 'ethereum' ? 'hash' : 'txid']: addressOrHash,
        id: addressOrHash,
        status: 'unsubscribed'
      }
    })
  } else {
    throw new Error(
      `Error trying to unsubscribe ${addressOrHash}: not a valid address or transaction id/hash`
    )
  }
}

export default unsubscribe
