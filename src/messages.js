import { session } from "./state"
import { createEventLog, networkName, serverEcho } from "./utilities"

export function sendMessage(msg) {
  session.socket.send(createEventLog(msg))
}

export function handleMessage(msg) {
  const { status, reason, event, nodeSyncStatus, connectionId } = JSON.parse(
    msg.data
  )

  if (connectionId) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("connectionId", connectionId)
    } else {
      session.connectionId = connectionId
    }
  }

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

    // ignore server echo messages
    if (serverEcho(eventCode)) {
      return
    }

    //handle change of hash in speedup and cancel events
    if (eventCode === "txSpeedUp" || eventCode === "txCancel") {
      session.transactions = session.transactions.map(tx => {
        if (tx.hash === transaction.originalHash) {
          tx.hash = transaction.hash
        }
        return tx
      })
    }

    const addressNotifier = session.accounts.find(function(a) {
      return (
        a.address.toLowerCase() ===
        (transaction.watchedAddress && transaction.watchedAddress.toLowerCase())
      )
    })

    addressNotifier && addressNotifier.emitter.emit(newState)

    const hashNotifier = session.transactions.find(function(t) {
      return t.id === transaction.id || t.hash === transaction.hash
    })

    const emitterResult = hashNotifier
      ? hashNotifier.emitter.emit(newState)
      : false

    session.transactionListeners &&
      session.transactionListeners.forEach(listener =>
        listener({ transaction: newState, emitterResult })
      )
  }
}
