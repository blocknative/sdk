import { take, filter } from 'rxjs/operators'
import { nanoid } from 'nanoid'
import { SimulationTransaction, SimulationTransactionOutput } from './types'
import { simulations$ } from './streams'
import SDK from '.'

function simulate(
  this: SDK,
  system: string,
  network: string,
  transaction: SimulationTransaction
): Promise<SimulationTransactionOutput> {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  // generate a nano ID, add into transaction object, instead of filtering() below, just match the nano id
  transaction.id = nanoid()

  // send payload to server
  this._sendMessage({
    categoryCode: 'simulate',
    eventCode: 'txSimulation',
    transaction: transaction
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

export default simulate
