import { Subject } from 'rxjs'
import { take, timeout } from 'rxjs/operators'
import { Config, Emitter } from './interfaces'
import { createEmitter } from './utilities'

function configuration(
  this: any,
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
  const previousConfiguration = this._configurations.get(casedScope)

  previousConfiguration &&
    previousConfiguration.subscription &&
    previousConfiguration.subscription.next()

  const subscription = new Subject()

  // create emitter for transaction
  const emitter = config.watchAddress ? { emitter: createEmitter() } : {}

  this._configurations.set(casedScope, {
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
      error: (error: { message: string }) =>
        reject(
          error.message === 'Timeout has occurred'
            ? `Configuration with scope: ${config.scope} has been sent to the Blocknative server, but has not received a reply within 5 seconds.`
            : error.message
        )
    })
  })
}

export default configuration
