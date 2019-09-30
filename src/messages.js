import { session } from "./state"
import { createEventLog, networkName } from "./utilities"

export function sendMessage(msg) {
  session.socket.send(createEventLog(msg))
}

export function handleMessage(msg) {
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

    const addressListener =
      addressNotifier &&
      addressNotifier.emitter &&
      (addressNotifier.emitter.listeners[eventCode] ||
        addressNotifier.emitter.listeners.all)

    addressListener && addressListener(newState)

    const hashNotifier = session.transactions.find(function(t) {
      return t.id === transaction.id || t.hash === transaction.hash
    })

    const hashListener =
      hashNotifier &&
      hashNotifier.emitter &&
      (hashNotifier.emitter.listeners[eventCode] ||
        hashNotifier.emitter.listeners.all)

    const emitterResult = hashNotifier
      ? hashListener && hashListener(newState)
      : false

    session.transactionListeners &&
      session.transactionListeners.forEach(listener =>
        listener({ transaction: newState, emitterResult })
      )
  }

  if (connectionId) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("connectionId", connectionId)
    } else {
      session.connectionId = connectionId
    }
  }
}
