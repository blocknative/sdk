import { Observable, Subject } from 'rxjs'
import type SDK from '../'
import subscribe from './subscribe'
import unsubscribe from './unsubscribe'

import {
  ChainId,
  MultiChainOptions,
  EthereumTransactionData,
  SDKError
} from '../types'

//**Experimental API that is not yet finalized and is in BETA*/
class MultiChain {
  public apiKey: string
  public ws: WebSocket | void
  public connections: Record<ChainId, SDK | null>
  public transactions$: Observable<EthereumTransactionData>
  public errors$: Subject<SDKError>
  public subscribe: typeof subscribe
  public unsubscribe: typeof unsubscribe
  public Blocknative: typeof SDK

  protected onTransaction$: Subject<EthereumTransactionData>

  constructor(options: MultiChainOptions, Blocknative: typeof SDK) {
    const { apiKey, ws } = options

    this.apiKey = apiKey
    this.ws = ws
    this.connections = {}
    this.onTransaction$ = new Subject()
    this.transactions$ = this.onTransaction$.asObservable()
    this.errors$ = new Subject()
    this.Blocknative = Blocknative
    this.subscribe = subscribe.bind(this)
    this.unsubscribe = unsubscribe.bind(this)
  }
}

export default MultiChain
