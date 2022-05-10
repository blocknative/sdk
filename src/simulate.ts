import {
  SimulationTransaction,
  SimulationTransactionOutput
} from './interfaces'
import { simulations$ } from './streams'
import { take, filter } from 'rxjs/operators'
import { nanoid } from 'nanoid'

export default function simulate(
  this: any,
  transactions: SimulationTransaction
): Promise<SimulationTransactionOutput> {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  const id = nanoid()
  // send payload to server
  this._sendMessage({
    categoryCode: 'simulate',
    eventCode: 'txSimulation',
    simPayload: {
      id,
      transactions
    }
  })

  return new Promise((resolve, reject) => {
    simulations$
      .pipe(
        filter(({ id }) => {
          return id === transaction.id
        }),
        take(1)
      )
      .subscribe({
        next: transaction => resolve(transaction),
        error: event => reject(event.error.message)
      })
  })
}
