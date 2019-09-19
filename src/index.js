import transaction from "./transaction"
import account from "./account"
import event from "./event"

import { connect } from "./websockets"
import { validateOptions } from "./validation"
import { session } from "./state"

function sdk(options) {
  validateOptions(options)

  const { dappId, networkId, transactionCallback, apiUrl, ws } = options
  const alreadyConnected = !!session.socket

  session.dappId = dappId
  session.networkId = networkId
  session.transactionCallback =
    session.transactionCallback || transactionCallback

  if (!alreadyConnected) {
    connect(
      apiUrl,
      ws
    ).catch(console.log)
  }

  return {
    transaction,
    account,
    event,
    status: session.status
  }
}

export default sdk
