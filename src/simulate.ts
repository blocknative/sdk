import { SimulationTransaction, SimulationTransactionOutput } from './interfaces'
import { simulations$ } from './streams'
import { take, filter } from 'rxjs/operators'
import { nanoid } from 'nanoid'


function simulate(this: any, system: string, network: string, transaction: SimulationTransaction): Promise<SimulationTransactionOutput> {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

    // TODO: validate incoming payload
    // TODO: get exact error messages


    // generate a nano ID, add into transaction object, instead of filtering() below, just match the nano id
    // transaction.id = nanoid()

    // send payload to server
    this._sendMessage({
      categoryCode: 'simulate',
      eventCode: 'txSimulation',
      transaction: transaction
    })
    console.log('DDDDDDDDFHGDFKJHSDKFHSDLFJHSLDKFJSLKFJSLDJFLKSDJ')
    console.log({ transaction })
    /*

    */

    return new Promise((resolve, reject) => {
      simulations$.pipe(filter(({system: simulateSystem, network: simulateNetwork, from, to, gas, gasPrice, input, value}) => {
        // return transaction.id === id
        return system === simulateSystem
          && network === simulateNetwork
          && from === transaction.from
          && to === transaction.to
          && gas === transaction.gas
          && gasPrice === transaction.gasPrice
          && input === transaction.input
          && value === transaction.value.toString()
      }), take(1)).subscribe({
        next: (transaction) => resolve(transaction),
        error: (event) => reject(event.error.message)
      })
    })
  // return a promise that resolves
  // } else {
  //   throw new Error(
  //     `Error trying to simulate ${transaction}. System: ${system}, Network: ${network}`
  //   )
  // }

}

export default simulate
