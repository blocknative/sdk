import { version } from "../package.json"

export function createEmitter() {
  return {
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
  }
}

export function createEventLog(msg, dappId, networkId) {
  console.log({ dappId, networkId })
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

export function networkName(id) {
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
