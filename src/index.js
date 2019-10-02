import SturdyWebSocket from "sturdy-websocket"

import transaction from "./transaction"
import account from "./account"
import event from "./event"

import { sendMessage, handleMessage } from "./messages"
import { validateOptions } from "./validation"
import { session } from "./state"

function sdk(options) {
  validateOptions(options)

  const { dappId, networkId, transactionListeners, apiUrl, ws } = options
  const alreadyConnected = !!session.socket

  session.dappId = dappId
  session.networkId = networkId
  session.transactionListeners =
    session.transactionListeners || transactionListeners

  if (!alreadyConnected) {
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

      const connectionId =
        (typeof window !== "undefined" &&
          window.localStorage.getItem("connectionId")) ||
        session.connectionId

      sendMessage({
        categoryCode: "initialize",
        eventCode: "checkDappId",
        connectionId
      })
    }

    session.socket.ondown = () => {
      session.status.connected = false
    }

    session.socket.onreopen = () => {
      session.status.connected = true

      const connectionId =
        (typeof window !== "undefined" &&
          window.localStorage.getItem("connectionId")) ||
        session.connectionId

      sendMessage({
        categoryCode: "initialize",
        eventCode: "checkDappId",
        connectionId
      })

      // re-register all accounts to be watched by server upon
      // re-connection as they don't get transferred over automatically
      // to the new connection like tx hashes do
      session.accounts.forEach(account => {
        sendMessage({
          eventCode: "accountAddress",
          categoryCode: "watch",
          account: {
            address: account.address
          }
        })
      })
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
