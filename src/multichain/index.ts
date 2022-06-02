import SDK from '../sdk'
import { Subject } from 'rxjs'
import subscribe from './subscribe'
import unsubscribe from './unsubscribe'
import { ChainId } from '../types'

import {
  EthereumTransactionData,
  InitializationOptions,
  SDKError
} from '../types'

class MultiChainWebSocket {
  public dappId: string
  public ws: WebSocket
  public connections: Record<ChainId, SDK | null>
  public transactions$: Subject<EthereumTransactionData>
  public errors$: Subject<SDKError>
  public subscribe: typeof subscribe
  public unsubscribe: typeof unsubscribe

  constructor(options: InitializationOptions) {
    const { dappId, ws } = options

    this.dappId = dappId
    this.ws = ws
    this.connections = {}
    this.transactions$ = new Subject()
    this.errors$ = new Subject()
    this.subscribe = subscribe.bind(this)
    this.unsubscribe = unsubscribe.bind(this)
  }
}

export default MultiChainWebSocket
