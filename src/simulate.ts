import { EventObject } from './interfaces'

function simulate(this: any, payload: any) {
  if (this._destroyed)
    throw new Error(
      'The WebSocket instance has been destroyed, re-initialize to continue making requests.'
    )

  if (payload) {
    // send payload to server
    this._sendMessage({
      categoryCode: 'simulate',
      eventCode: 'txSimulation',
      payload: payload // ???????
    })
  } else {
    throw new Error(
      `Error trying to simulate ${payload}`
    )
  }
}

export default simulate
