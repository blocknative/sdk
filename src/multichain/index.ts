import Blocknative from '..'
import { Observable, Subject } from 'rxjs'
import subscribe from './subscribe'
import unsubscribe from './unsubscribe'

import {
  ChainId,
  MultiChainOptions,
  EthereumTransactionData,
  SDKError
} from '../types'

class MultiChain {
  public apiKey: string
  public ws: WebSocket | void
  public connections: Record<ChainId, Blocknative | null>
  public transactions$: Observable<EthereumTransactionData>
  public errors$: Subject<SDKError>
  public subscribe: typeof subscribe
  public unsubscribe: typeof unsubscribe

  protected onTransaction$: Subject<EthereumTransactionData>

  constructor(options: MultiChainOptions) {
    const { apiKey, ws } = options

    this.apiKey = apiKey
    this.ws = ws
    this.connections = {}
    this.onTransaction$ = new Subject()
    this.transactions$ = this.onTransaction$.asObservable()
    this.errors$ = new Subject()
    this.subscribe = subscribe.bind(this)
    this.unsubscribe = unsubscribe.bind(this)
  }
}

export default MultiChain
