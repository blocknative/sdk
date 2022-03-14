import { SimulationTransaction } from './interfaces'

function simulate(this: any, system: string, network: string, transaction: SimulationTransaction) {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  if (transaction) {
    // send payload to server
    this._sendMessage({
      categoryCode: 'simulate',
      eventCode: 'txSimulation',
      transaction: transaction
    })
    // return a promise that resolves
  } else {
    throw new Error(
      `Error trying to simulate ${transaction}. System: ${system}, Network: ${network}`
    )
  }

}

export default simulate
