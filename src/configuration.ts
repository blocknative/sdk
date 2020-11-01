import { Subject } from 'rxjs'
import { take, timeout } from 'rxjs/operators'
import { Config } from './interfaces'

function configuration(this: any, config: Config) {
  if (this._destroyed) {
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )
  }

  const subscription = new Subject()

  const existingSubscription = this._configurationsAwaitingResponse.get(
    config.scope
  )
  if (existingSubscription) {
    // already setting a config for this scope, so resolve the original one
    existingSubscription.next(
      `Canceling due to new configuration being set for scope: ${config.scope}`
    )
  }

  this._configurationsAwaitingResponse.set(config.scope, subscription)

  return new Promise((resolve, reject) => {
    subscription.pipe(take(1), timeout(3000)).subscribe({
      next: resolve,
      error: reject
    })

    this._sendMessage({
      categoryCode: 'configs',
      eventCode: 'put',
      config
    })
  })
}

export default configuration
