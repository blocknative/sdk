import { merge, timer } from 'rxjs'
import { filter, take } from 'rxjs/operators'
import MultiChainWebSocket from '.'
import Blocknative from '../sdk'
import { Address, ChainId, Hash } from '../types'

type UnsubscribeOptions = {
  //**Address or tx hash to unsubscribe from */
  id: Address | Hash
  //**chain to unsubscribe from, if not provided id will be unsubbed from all chains */
  chainId?: ChainId
  //**timeout in ms to wait for any events before unsubscribing to ensure no missed events */
  timeout?: number
}

function unsubscribe(
  this: MultiChainWebSocket,
  options: UnsubscribeOptions
): void {
  const { id, chainId, timeout = 0 } = options
  const time$ = timer(timeout)

  const transactionEvent$ = this.transactions$.pipe(
    filter(({ hash, watchedAddress }) => hash === id || watchedAddress === id)
  )

  merge(transactionEvent$, time$)
    .pipe(take(1)) // take just first event
    .subscribe(res => {
      // if number, then timeout with no transaction events, so go ahead and unsub
      if (typeof res === 'number') {
        const sdkConnections = Object.entries(this.connections).filter(
          ([chainId, sdk]) => sdk !== null
        ) as [ChainId, Blocknative][]

        sdkConnections.forEach(([connectionChainId, sdk]) => {
          // if chainId is passed and it doesn't match, then no unsub (return early)
          if (chainId && connectionChainId !== chainId) return

          sdk.unsubscribe(id)

          // if no remaining subscriptions, destroy connection and set to null
          if (
            !sdk.watchedAccounts.length &&
            !sdk.watchedTransactions.length &&
            !sdk.configurations.size
          ) {
            sdk.destroy()
            this.connections[connectionChainId] = null
          }
        })
      } else {
        // otherwise a transaction event received, so call unsub again for another timeout
        this.unsubscribe(options)
      }
    })
}

export default unsubscribe
