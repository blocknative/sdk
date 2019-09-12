import { session } from "./state"
import { createEventLog, networkName } from "./utilities"

export function sendMessage(msg) {
  session.socket.send(createEventLog(msg))
}

export function handleMessage(msg) {
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
  }

  if (connectionId) {
    if (window) {
      window.localStorage.setItem("connectionId", connectionId)
    } else {
      session.connectionId = connectionId
    }
  }
}
