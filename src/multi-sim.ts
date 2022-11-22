import { take, filter } from 'rxjs/operators'
import { nanoid } from 'nanoid'
import { SimulationTransaction, MultiSimOutput } from './types'
import { simulations$ } from './streams'
import SDK from '.'

function multiSim(
  this: SDK,
  transactions: SimulationTransaction[]
): Promise<MultiSimOutput> {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  const id = nanoid()

  // send payload to server
  this._sendMessage({
    categoryCode: 'simulate',
    eventCode: 'txSimulation',
    eventId: id,
    transaction: transactions
  })

  return new Promise((resolve, reject) => {
    simulations$
      .pipe(
        filter(({ eventId }) => {
          return eventId === id
        }),
        take(1)
      )
      .subscribe({
        next: ({ transaction }) => resolve(transaction as MultiSimOutput),
        error: ({ error }) => reject(error.message)
      })
  })
}

export default multiSim
