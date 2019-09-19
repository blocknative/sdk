import SturdyWebSocket from "sturdy-websocket"
import uuid from "uuid/v4"

import transaction from "./transaction"
import account from "./account"
import event from "./event"

import { handleMessage, sendMessage } from "./messages"
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
    const connectionId =
      (window && window.localStorage.getItem("connectionId")) ||
      session.connectionId ||
      uuid()

    if (window) {
      window.localStorage.setItem("connectionId", connectionId)
    } else {
      session.connectionId = connectionId
    }

    if (ws) {
      session.socket = new SturdyWebSocket(
        apiUrl || `wss://api.blocknative.com/v0?connectionId=${connectionId}`,
        {
          wsConstructor: ws
        }
      )
    } else {
      session.socket = new SturdyWebSocket(
        apiUrl || `wss://api.blocknative.com/v0?connectionId=${connectionId}`
      )
    }

    session.socket.onopen = () => {
      session.status.connected = true
    }

    session.socket.ondown = () => {
      session.status.connected = false
    }

    session.socket.onreopen = () => {
      session.status.connected = true
    }

    session.socket.onmessage = handleMessage
  }

  sendMessage({
    categoryCode: "initialize",
    eventCode: "checkDappId"
  })

  return {
    transaction,
    account,
    event,
    status: session.status
  }
}

export default sdk
