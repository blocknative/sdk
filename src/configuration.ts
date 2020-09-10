import { Config } from './interfaces'

function configuration(this: any, config: Config) {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  this._sendMessage({
    categoryCode: 'configs',
    eventCode: 'put',
    config
  })
}

export default configuration
