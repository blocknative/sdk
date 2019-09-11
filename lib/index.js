import SturdyWebSocket from "sturdy-websocket"

import transaction from "./transaction"
import account from "./account"
import event from "./event"

import { handleMessage, sendMessage } from "./messages"
import { validateOptions } from "./validation"
import { session } from "./state"

function sdk(options) {
  validateOptions(options)

  const { dappId, networkId, transactionCallback, apiUrl } = options

  session.dappId = dappId
  session.networkId = networkId
  session.transactionCallback = transactionCallback

  session.socket = new SturdyWebSocket(apiUrl || "wss://api.blocknative.com/v0")

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

  const connectionId =
    (window && window.localStorage.getItem("connectionId")) ||
    session.connectionId

  sendMessage({
    categoryCode: "initialize",
    eventCode: "checkDappId",
    connectionId
  })

  return {
    transaction,
    account,
    event,
    status: session.status
  }
}

export default sdk
