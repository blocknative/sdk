import SturdyWebSocket from "sturdy-websocket"

import transaction from "./transaction"
import account from "./account"
import event from "./event"

import { handleMessage, sendMessage } from "./messages"
import { validateOptions } from "./validation"

class sdk {
  constructor(options) {
    validateOptions(options)

    this.transactions = []
    this.accounts = []
    this.dappId = options.dappId
    this.networkId = options.networkId
    this.transactionCallback = options.transactionCallback

    this.transaction = transaction.bind(this)
    this.account = account.bind(this)
    this.event = event.bind(this)

    this.handleMessage = handleMessage.bind(this)
    this.sendMessage = sendMessage.bind(this)

    this.status = {
      connected: false,
      nodeSynced: true
    }

    this.connectionId =
      (window && window.localStorage.getItem("connectionId")) ||
      options.connectionId

    if (options.ws) {
      this.socket = new SturdyWebSocket(
        options.apiUrl || "wss://api.blocknative.com/v0",
        {
          wsConstructor: options.ws
        }
      )
    } else {
      this.socket = new SturdyWebSocket(
        options.apiUrl || "wss://api.blocknative.com/v0"
      )
    }

    this.socket.onopen = () => {
      this.status.connected = true
    }

    this.socket.ondown = () => {
      this.status.connected = false
    }

    this.socket.onreopen = () => {
      this.status.connected = true
    }

    this.socket.onmessage = this.handleMessage

    this.sendMessage({
      categoryCode: "initialize",
      eventCode: "checkDappId",
      connectionId: this.connectionId
    })
  }
}

export default sdk
