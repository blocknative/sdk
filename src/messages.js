import { session } from "./state"
import { createEventLog, networkName, serverEcho, last } from "./utilities"

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

    // flatten in to one object
    const newState = { ...transaction, eventCode, contractCall }

    // ignore server echo messages
    if (serverEcho(eventCode)) {
      return
    }

    // handle change of hash in speedup and cancel events
    if (eventCode === "txSpeedUp" || eventCode === "txCancel") {
      session.transactions = session.transactions.map(tx => {
        if (tx.hash === transaction.originalHash) {
          // reassign hash parameter in transaction queue to new hash
          tx.hash = transaction.hash
        }
        return tx
      })
    }

    const watchedAddress =
      transaction.watchedAddress && transaction.watchedAddress.toLowerCase()

    let emitterResult

    if (watchedAddress) {
      const addressNotifier = session.accounts.find(
        account => account.address === watchedAddress
      )

      const results =
        addressNotifier &&
        addressNotifier.emitters.map(emitter => emitter.emit(newState))

      // the emitter result that affects notifications in notify is the result from the latest emitter
      emitterResult = last(results)
    } else {
      const hashNotifier = session.transactions.find(
        tx => tx.id === transaction.id || tx.hash === transaction.hash
      )

      const results =
        hashNotifier &&
        hashNotifier.emitters.map(emitter => emitter.emit(newState))

      // the emitter result that affects notifications in notify is the result from the latest emitter
      emitterResult = last(results)
    }

    session.transactionListeners &&
      session.transactionListeners.forEach(listener =>
        listener({ transaction: newState, emitterResult })
      )
  }
}
