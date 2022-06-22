import { fromEvent, Observable } from 'rxjs'
import { filter, finalize, takeWhile } from 'rxjs/operators'
import MultiChainWebSocket from '.'
import type SDK from '../'
import { networkName } from '../utilities'

import {
  AccountSubscription,
  EthereumTransactionData,
  Subscription
} from '../types'

function subscribe(
  this: MultiChainWebSocket,
  subscription: Subscription
): Observable<EthereumTransactionData | null> {
  const { id, chainId, type } = subscription

  if (!networkName('ethereum', parseInt(chainId, 16))) {
    throw new Error(`chainId: ${chainId} is an unsupported network`)
  }

  if (!this.connections[chainId]) {
    this.connections[chainId] = new this.Blocknative({
      system: 'ethereum',
      networkId: parseInt(chainId, 16),
      dappId: this.apiKey,
      ws: this.ws,
      transactionHandlers: [
        ({ transaction }) => {
          this.onTransaction$.next(transaction as EthereumTransactionData)
        }
      ],
      onerror: error => this.errors$.next(error)
    })
  }

  const sdk = this.connections[chainId] as SDK

  if (type === 'account') {
    const { filters = [], abi = [] } = subscription as AccountSubscription

    sdk.configuration({
      scope: id,
      filters,
      abi,
      watchAddress: true
    })

    return this.transactions$.pipe(
      filter(({ watchedAddress }) => watchedAddress === id),
      finalize(() => {
        this.unsubscribe({ id, chainId })
      })
    )
  } else {
    const { emitter } = sdk.transaction(id)

    return fromEvent<EthereumTransactionData>(
      // eslint-disable-next-line
      // @ts-ignore - string does not match specific eventcode string
      emitter,
      'all'
    ).pipe(
      // automatically complete stream on a finalized status
      takeWhile(
        ({ status }) =>
          status !== 'confirmed' && status !== 'failed' && status !== 'dropped',
        true
      ),
      // cleanup subscription and SDK on completion
      finalize(() => {
        this.unsubscribe({ id, chainId })
      })
    )
  }
}

export default subscribe
