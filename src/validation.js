import ow from "ow"
import { isValidAddress } from "ethereumjs-util"

export function validateOptions(options) {
  ow(
    options,
    "options",
    ow.object.exactShape({
      networkId: ow.number,
      dappId: ow.string,
      transactionListeners: ow.optional.array.ofType(ow.function),
      apiUrl: ow.optional.string,
      ws: ow.optional.function
    })
  )
}

export function validateEvent(event) {
  ow(
    event,
    "event",
    ow.object.exactShape({
      eventCode: ow.string,
      categoryCode: ow.string,
      transaction: ow.optional.object.exactShape({
        id: ow.optional.string,
        to: ow.string,
        from: ow.optional.string,
        value: ow.optional.string,
        gas: ow.optional.string,
        gasPrice: ow.optional.string,
        nonce: ow.optional.number,
        status: ow.optional.string
      }),
      wallet: ow.optional.object.exactShape({
        balance: ow.optional.string
      }),
      contract: ow.optional.object.exactShape({
        methodName: ow.optional.string,
        parameters: ow.optional.array
      })
    })
  )
}

export function validateAddress(address) {
  ow(address, "address", ow.string.is(validAddress))
}

export function validateHash(hash) {
  ow(hash, "hash", ow.string.is(validTxHash))
}

export function validateId(id) {
  ow(id, "id", ow.string)
}

function validAddress(address) {
  return isValidAddress(address) || `${address} is an invalid ethereum address`
}

function validTxHash(hash) {
  return (
    /^0x([A-Fa-f0-9]{64})$/.test(String(hash)) || `${hash} is an invalid hash`
  )
}
