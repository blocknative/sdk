import SturdyWebSocket from "sturdy-websocket"

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
      session.connectionId

    if (ws) {
      session.socket = new SturdyWebSocket(
        apiUrl || "wss://api.blocknative.com/v0",
        {
          wsConstructor: ws
        }
      )
    } else {
      session.socket = new SturdyWebSocket(
        apiUrl || "wss://api.blocknative.com/v0"
      )
    }

    session.socket.onopen = () => {
      session.status.connected = true
      sendMessage({
        categoryCode: "initialize",
        eventCode: "checkDappId",
        connectionId
      })
    }

    session.socket.ondown = () => {
      session.status.connected = false
      session.status.dropped = true
    }

    session.socket.onreopen = () => {
      session.status.connected = true
    }

    session.socket.onmessage = handleMessage
  }

  return {
    transaction,
    account,
    event,
    status: session.status
  }
}

export default sdk
