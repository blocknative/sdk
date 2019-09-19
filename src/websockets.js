import Promise from "promise-polyfill"
import { session } from "./state"
import { createEventLog, networkName } from "./utilities"

export function connect(url, ws) {
  return new Promise((resolve, reject) => {
    session.pendingSocketConnection = true

    try {
      session.socket = ws
        ? new ws(url || "wss://api.blocknative.com/v0")
        : new WebSocket(url || "wss://api.blocknative.com/v0")
    } catch (err) {
      session.pendingSocketConnection = false
      reject(err)
    }

    session.socket.addEventListener("message", handleMessage)

    session.socket.addEventListener(
      "close",
      () => (session.socketConnection = false)
    )

    session.socket.addEventListener("error", err => {
      session.pendingSocketConnection = false
      reject(err)
    })

    session.socket.addEventListener("open", () => {
      session.socketConnection = true
      session.pendingSocketConnection = false

      const connectionId =
        (window && window.localStorage.getItem("connectionId")) ||
        session.connectionId

      sendMessage({
        categoryCode: "initialize",
        eventCode: "checkDappId",
        connectionId
      })

      resolve(true)
    })
  })
}

export function sendMessage(msg) {
  var eventLog = createEventLog(msg)

  if (!session.socketConnection) {
    waitForConnection().then(() => session.socket.send(eventLog))
  } else {
    session.socket.send(eventLog)

    checkForSocketConnection().then(function(connected) {
      return (
        !connected &&
        retrySendMessage(function() {
          return sendMessage(msg)
        })
      )
    })
  }
}

function waitForConnection() {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (!session.pendingSocketConnection && session.socketConnection) {
        clearInterval(interval)
        resolve
      }
    }, 250)
  })
}

function checkForSocketConnection() {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!session.socketConnection) {
        resolve(false)
      }
      resolve(true)
    }, 250)
  })
}

function retrySendMessage(logFunc) {
  connect()
    .then(logFunc)
    .catch(() => setTimeout(logFunc, 250))
}

function handleMessage(msg) {
  const { status, reason, event, nodeSyncStatus, connectionId } = JSON.parse(
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
      session.transactions = session.transactions.map(tx => {
        if (tx.hash === transaction.originalHash) {
          tx.hash = transaction.hash
        }
        return tx
      })
    }

    // check if this transaction is for a watched address or not
    if (transaction.watchedAddress) {
      notifier = session.accounts.find(
        a =>
          a.address.toLowerCase() === transaction.watchedAddress.toLowerCase()
      )
    } else {
      notifier = session.transactions.find(
        t => t.id === transaction.id || t.hash === transaction.hash
      )
    }

    const listener =
      notifier && notifier.emitter && notifier.emitter.listeners[eventCode]

    const emitterResult =
      listener && notifier.emitter.listeners[eventCode](newState)

    session.transactionCallback &&
      session.transactionCallback({ transaction: newState, emitterResult })

    if (connectionId) {
      if (window) {
        window.localStorage.setItem("connectionId", connectionId)
      } else {
        session.connectionId = connectionId
      }
    }
  }
}
