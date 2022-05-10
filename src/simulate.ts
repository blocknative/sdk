import {
  SimulationTransaction,
  SimulationTransactionResult
} from './interfaces'
import { simulations$ } from './streams'
import { take, filter, map } from 'rxjs/operators'
import { nanoid } from 'nanoid'

export default function simulate(
  this: any,
  transaction: SimulationTransaction[]
): Promise<SimulationTransactionResult> {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  const payloadId = nanoid()
  console.log('00 Transaction: ', transaction)
  // send payload to server
  this._sendMessage({
    categoryCode: 'simulate',
    eventCode: 'txSimulation',
    simPayload: {
      id: payloadId,
      transaction
    }
  })

  return new Promise((resolve, reject) => {
    simulations$
      .pipe(
        filter(({ id }) => {
          console.log('0 Id: ', id, payloadId)
          return id === payloadId
        }),
        map(({ id, ...restOfPayload }) => restOfPayload),
        take(1)
      )
      .subscribe({
        next: transaction => {
          console.log('1 Transaction: ', transaction)
          resolve(transaction)
        },
        error: event => {
          console.log('2 error: ', event)
          reject(event)
        }
      })
  })
}
