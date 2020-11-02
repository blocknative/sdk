import { Config } from './interfaces'
import { createEmitter } from './utilities'

function configuration(this: any, config: Config) {
  if (this._destroyed) {
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )
  }

  // create emitter for transaction
  const emitter = createEmitter()

  this._configurations.set(config.scope.toLowerCase(), { ...config, emitter })

  this._sendMessage({
    categoryCode: 'configs',
    eventCode: 'put',
    config
  })

  return {
    emitter,
    details: {
      config
    }
  }
}

export default configuration
