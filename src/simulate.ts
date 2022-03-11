import { SimulationTransaction } from './interfaces'

function simulate(this: any, system: string, network: string, transaction: SimulationTransaction) {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  if (transaction) {
    // send payload to server
    // jm TODO
    this._sendMessage({
      categoryCode: 'simulate',
      eventCode: 'txSimulation',
      transaction: transaction
    })
  } else {
    throw new Error(
      `Error trying to simulate ${transaction}`
    )
  }
}

export default simulate