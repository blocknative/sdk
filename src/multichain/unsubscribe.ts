import MultiChainWebSocket from '.'
import Blocknative from '..'
import { Address, ChainId, Hash } from '../types'

function unsubscribe(
  this: MultiChainWebSocket,
  subscription: { id: Address | Hash; chainId?: ChainId }
): void {
  const { id, chainId } = subscription

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
}

export default unsubscribe
