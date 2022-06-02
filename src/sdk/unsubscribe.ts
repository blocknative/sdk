import SDK from '.'
import { Ac, Tx } from '../types'
import { isAddress, isTxid } from '../utilities'

function unsubscribe(this: SDK, addressOrHash: string) {
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
    this.watchedAccounts = this.watchedAccounts.filter(
      (ac: Ac) => ac.address !== normalizedAddress
    )

    // remove configuration from memory
    this.configurations.delete(normalizedAddress)

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
    this.watchedTransactions = this.watchedTransactions.filter(
      (tx: Tx) => tx.hash !== addressOrHash
    )

    const transactionId =
      this._system === 'ethereum'
        ? { hash: addressOrHash }
        : { txid: addressOrHash }

    const transaction = {
      ...transactionId,
      id: addressOrHash,
      status: 'unsubscribed'
    }

    // logEvent to server
    this._sendMessage({
      categoryCode: 'activeTransaction',
      eventCode: 'unwatch',
      transaction
    })
  } else {
    throw new Error(
      `Error trying to unsubscribe ${addressOrHash}: not a valid address or transaction id/hash`
    )
  }
}

export default unsubscribe
