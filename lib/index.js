import SturdyWebSocket from "sturdy-websocket"
import { version } from "../package.json"
import {
  validateOptions,
  validateEvent,
  validateAddress,
  validateHash,
  validateId
} from "./validation"

let session = {
  socket: null,
  networkId: null,
  dappId: null,
  transactionCallback: null,
  status: {
    nodeSynced: true,
    connected: null
  }
}

let transactions = []
let accounts = []

function Blocknative(options) {
  validateOptions(options)
  session = { ...session, ...options }

  session.socket = new SturdyWebSocket("wss://staging.api.blocknative.com/v0")

  session.socket.onopen = () => {
    session.status.connected = true
  }

  session.socket.ondown = () => {
    session.status.connected = false
  }

  session.socket.onreopen = () => {
    session.status.connected = true
  }

  session.socket.onmessage = handleSocketMessage

  logToServer({
    categoryCode: "initialize",
    eventCode: "checkDappId",
    connectionId: window.localStorage.getItem("connectionId") || undefined
  })

  return {
    transaction,
    account,
    event,
    status: session.status
  }
}

function transaction(hash, id) {
  validateHash(hash)
  validateId(id)

  // create startTime for transaction
  const startTime = Date.now()

  // create emitter for transaction
  const emitter = createEmitter()

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
      id: id || hash,
      startTime,
      status: "sent"
    }
  })

  const transactionObj = {
    details: {
      hash,
      startTime,
      eventCode
    },
    emitter
  }

  return transactionObj
}

function account(address) {
  validateAddress(address)

  // create emitter for transaction
  const emitter = createEmitter()

  // create eventCode for transaction
  const eventCode = "accountAddress"

  // put in queue
  accounts.push({
    address,
    emitter
  })

  // logEvent to server
  logToServer({
    eventCode,
    categoryCode: "watch",
    account: {
      address
    }
  })

  return {
    emitter,
    details: {
      address
    }
  }
}

function event(eventObj) {
  validateEvent(eventObj)
  logToServer(eventObj)
}

const createEmitter = () => ({
  listeners: {},
  on: function(eventCode, listener) {
    // check if valid eventCode
    switch (eventCode) {
      case "txPool":
      case "txConfirmed":
      case "txSpeedUp":
      case "txCancel":
      case "txFailed":
        break
      default:
        throw new Error(
          `${eventCode} is not a valid event code, for a list of valid event codes see: https://github.com/blocknative/bn-api-client#event-codes`
        )
    }

    // check that listener is a function
    if (typeof listener !== "function") {
      throw new Error("Listener must be a function")
    }

    // add listener for the eventCode
    this.listeners[eventCode] = listener
  }
})

function handleSocketMessage(msg) {
  const { status, reason, event, connectionId, nodeSyncStatus } = JSON.parse(
    msg.data
  )

  // handle node sync status change
  if (
    nodeSyncStatus !== undefined &&
    nodeSyncStatus.blockchain === "ethereum" &&
    nodeSyncStatus.network === networkName(session.networkId)
  ) {
    session.status.nodeSynced = nodeSyncStatus.synced
  }

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

    if (reason.includes("maximum allowed amount")) {
      const errorObj = new Error(reason)
      errorObj.eventCode = "maximumAddresses"
      throw errorObj
    }
  }

  if (event && event.transaction) {
    const { transaction, eventCode, contractCall } = event
    const newState = { ...transaction, eventCode, contractCall }
    let notifier

    if (eventCode === "txSpeedUp" || eventCode === "txCancel") {
      transactions = transactions.map(tx => {
        if (tx.hash === transaction.originalHash) {
          tx.hash = transaction.hash
        }
        return tx
      })
    }

    // check if this transaction is for a watched address or not
    if (transaction.watchedAddress) {
      notifier = accounts.find(
        a =>
          a.address.toLowerCase() === transaction.watchedAddress.toLowerCase()
      )
    } else {
      notifier = transactions.find(
        t => t.id === transaction.id || t.hash === transaction.hash
      )
    }

    const listener =
      notifier && notifier.emitter && notifier.emitter.listeners[eventCode]

    const emitterResult =
      listener && notifier.emitter.listeners[eventCode](newState)

    session.transactionCallback &&
      session.transactionCallback({ transaction: newState, emitterResult })
  }

  if (connectionId) {
    window.localStorage.setItem("connectionId", connectionId)
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
