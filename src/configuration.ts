import { Subject } from 'rxjs'
import { take, timeout } from 'rxjs/operators'
import { Config, Emitter, SimulationTransaction } from './interfaces'
import { createEmitter } from './utilities'


function configuration(
  this: any,
  transaction: SimulationTransaction,
): Promise<string | { details: { }; emitter?: Emitter }> {
  if (this._destroyed) {
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )
  }
  //
  // const casedScope =
  //   this._system === 'ethereum' ? config.scope.toLowerCase() : config.scope
  //
  // // resolve previous configuration if exists
  // const previousConfiguration = this._configurations.get(casedScope)

  previousConfiguration &&
    previousConfiguration.subscription &&
    previousConfiguration.subscription.next()

  const subscription = new Subject()

  // create emitter for transaction
  const emitter = { emitter: createEmitter() }
  //
  // this._configurations.set(casedScope, {
  //   ...config,
  //   ...emitter,
  //   subscription
  // })

  this._sendMessage({
    // categoryCode: 'configs',
    // eventCode: 'put',
    // config

    categoryCode: 'simulate',
    eventCode: 'txSimulation',
    transaction
  })

  return new Promise((resolve, reject) => {
    subscription.pipe(take(1), timeout(5000)).subscribe({
      next: () => resolve({ ...emitter, details: { transaction } }),
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

export default configuration
