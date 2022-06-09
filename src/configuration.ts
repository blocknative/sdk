import { Subject } from 'rxjs'
import { take, timeout } from 'rxjs/operators'
import Blocknative from '.'
import { Config, Emitter } from './interfaces'
import { createEmitter } from './utilities'

function configuration(
  this: Blocknative,
  config: Config
): Promise<string | { details: { config: Config }; emitter?: Emitter }> {
  if (this._destroyed) {
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )
  }

  const casedScope =
    this._system === 'ethereum' ? config.scope.toLowerCase() : config.scope

  // resolve previous configuration if exists
  const previousConfiguration = this.configurations.get(casedScope)

  previousConfiguration &&
    previousConfiguration.subscription &&
    previousConfiguration.subscription.next()

  const subscription = new Subject<string>()

  // create emitter for transaction
  const emitter = config.watchAddress ? { emitter: createEmitter() } : {}

  this.configurations.set(casedScope, {
    ...config,
    ...emitter,
    subscription
  })

  this._sendMessage({
    categoryCode: 'configs',
    eventCode: 'put',
    config
  })

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

export default configuration
