import SturdyWebSocket from "sturdy-websocket"
import ow from "ow"
import { version } from "../package.json"

let session = {
  socket: null,
  connected: null,
  connectionId: null,
  networkId: null,
  dappId: null,
  transactionCallback: null
}

let transactions = []

function Blocknative(options) {
  validateOptions(options)
  session = { ...session, ...options }

  session.socket = new SturdyWebSocket("wss://api.blocknative.com/v0")

  session.socket.onmessage = handleSocketMessage

  return {
    transaction
  }
}

function transaction(hash) {
  // create timestamp for transaction
  const timestamp = Date.now()

  // create emitter for transaction
  const emitter = createEmitter(hash)

  // create eventCode for transaction
  const eventCode = "txSent"

  // put in queue
  transactions.push({
    hash,
    emitter
  })

  // logEvent to server
  logToServer({
    eventCode,
    categoryCode: "activeTransaction",
    transaction: {
      hash,
      id: hash
    }
  })

  const transactionObj = {
    details: {
      hash,
      timestamp,
      eventCode
    },
    emitter
  }

  return transactionObj
}

const createEmitter = () => ({
  listeners: {},
  on: function(eventCode, listener) {
    if (typeof listener !== "function") {
      throw new Error("Listener must be a function")
    }
    this.listeners[eventCode] = listener
  }
})

function validateOptions(options) {
  ow(
    options,
    "options",
    ow.object.exactShape({
      networkId: ow.number,
      dappId: ow.string,
      connectionId: ow.optional.string,
      transactionCallback: ow.optional.function
    })
  )
}

function handleSocketMessage(msg) {
  const { status, reason, event, connectionId } = JSON.parse(msg.data)

  // handle any errors from the server
  if (status === "error") {
    if (reason.includes("not a valid API key")) {
      const errorObj = new Error(reason)
      errorObj.eventCode = "initFail"
      throw errorObj
    }

    if (reason.includes("network not supported")) {
      const errorObj = new Error(reason)
      errorObj.eventCode = "initFail"
      throw errorObj
    }
  }

  if (event && event.transaction) {
    const { transaction, eventCode } = event
    const newState = { ...transaction, eventCode }
    const notifier = transactions.find(
      t => t.hash.toLowerCase() === transaction.hash.toLowerCase()
    )

    if (notifier) {
      const listener = notifier.emitter && notifier.emitter.listeners[eventCode]

      const emitterResult =
        listener && notifier.emitter.listeners[eventCode](newState)

      session.transactionCallback &&
        session.transactionCallback({ transaction: newState, emitterResult })
    }
  }

  if (connectionId) {
    session.connectionId = connectionId
  }
}

function logToServer(msg) {
  session.socket.send(createEventLog(msg))
}

function createEventLog(msg) {
  const { dappId, networkId } = session

  return JSON.stringify({
    timeStamp: new Date(),
    dappId,
    version,
    blockchain: {
      system: "ethereum",
      network: networkName(networkId)
    },
    ...msg
  })
}

function networkName(id) {
  switch (id) {
    case 1:
      return "main"
    case 3:
      return "ropsten"
    case 4:
      return "rinkeby"
    case 5:
      return "goerli"
    case 42:
      return "kovan"
    case "localhost":
      return "localhost"
    default:
      return "local"
  }
}

export default Blocknative
