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

  // resolve previous configuration if exists
  const previousConfiguration = this._configurations.get(
    config.scope.toLowerCase()
  )

  previousConfiguration &&
    previousConfiguration.subscription &&
    previousConfiguration.subscription.next()

  const subscription = new Subject()

  // create emitter for transaction
  const emitter = config.watchAddress ? { emitter: createEmitter() } : {}

  this._configurations.set(config.scope.toLowerCase(), {
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
      error: reject
    })
  })
}

export default configuration
