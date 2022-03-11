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


  return new Promise((resolve, reject) => {
    subscription.pipe(take(1), timeout(5000)).subscribe({
      next: () => resolve({ ...emitter, details: { config } }),
      error: (error: { message: string }) => {
        const message =
          error.message === 'Timeout has occurred'
            ? `Configuration with scope: ${config.scope} has been sent to the Blocknative server, but has not received a reply within 5 seconds.`
            : error.message

        if (this._onerror) {
          this._onerror({ message })
          resolve(`Error: ${message}`)
        } else {
          reject(message)
        }
      }
    })
  })
}

export default simulate
