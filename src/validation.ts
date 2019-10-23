import { EventObject } from './interfaces'

export function validateType(options: {
  name: string
  value: any
  type: string
  optional?: boolean
  customValidation?: (val: any) => boolean
}): never | void {
  const { name, value, type, optional, customValidation } = options

  if (!optional && typeof value === 'undefined') {
    throw new Error(`"${name}" is required`)
  }

  if (
    typeof value !== 'undefined' &&
    (type === 'array' ? Array.isArray(type) : typeof value !== type)
  ) {
    throw new Error(
      `"${name}" must be of type: ${type}, received type: ${typeof value} from value: ${value}`
    )
  }

  if (typeof value !== 'undefined' && customValidation && !customValidation(value)) {
    throw new Error(`"${value}" is not a valid "${name}"`)
  }
}

export function validateOptions(options: any): never | void {
  validateType({ name: 'sdk options', value: options, type: 'object' })

  const { dappId, networkId, transactionHandler, apiUrl, ws } = options

  validateType({ name: 'dappId', value: dappId, type: 'string' })
  validateType({ name: 'networkId', value: networkId, type: 'number' })
  validateType({
    name: 'transactionHandler',
    value: transactionHandler,
    type: 'function',
    optional: true
  })
  validateType({ name: 'apiUrl', value: apiUrl, type: 'string', optional: true })
  validateType({ name: 'ws', value: ws, type: 'function', optional: true })
}

export function validateTransaction(clientIndex: number, hash: string, id?: string): never | void {
  validateType({ name: 'clientIndex', value: clientIndex, type: 'number' })
  validateType({ name: 'hash', value: hash, type: 'string', customValidation: validTxHash })
  validateType({ name: 'id', value: id, type: 'string', optional: true })
}

export function validateAccount(clientIndex: number, address: string): never | void {
  validateType({ name: 'clientIndex', value: clientIndex, type: 'number' })
  validateType({ name: 'address', value: address, type: 'string', customValidation: isAddress })
}

export function validateEvent(eventObj: EventObject): never | void {
  validateType({ name: 'eventObj', value: eventObj, type: 'object' })

  const { eventCode, categoryCode, transaction, wallet, contract } = eventObj

  validateType({ name: 'eventCode', value: eventCode, type: 'string' })
  validateType({ name: 'categoryCode', value: categoryCode, type: 'string' })

  validateType({ name: 'transaction', value: transaction, type: 'object', optional: true })

  if (transaction) {
    const { id, to, from, value, gas, gasPrice, nonce, status, startTime } = transaction

    validateType({ name: 'id', value: id, type: 'string', optional: true })
    validateType({
      name: 'to',
      value: to,
      type: 'string',
      optional: true,
      customValidation: isAddress
    })
    validateType({
      name: 'from',
      value: from,
      type: 'string',
      optional: true,
      customValidation: isAddress
    })
    validateType({ name: 'value', value: value, type: 'string', optional: true })
    validateType({ name: 'gas', value: gas, type: 'string', optional: true })
    validateType({ name: 'gasPrice', value: gasPrice, type: 'string', optional: true })
    validateType({ name: 'nonce', value: nonce, type: 'number', optional: true })
    validateType({ name: 'status', value: status, type: 'string', optional: true })
    validateType({ name: 'startTime', value: startTime, type: 'number', optional: true })
  }

  validateType({ name: 'wallet', value: wallet, type: 'object', optional: true })

  if (wallet) {
    const { balance } = wallet
    validateType({ name: 'balance', value: balance, type: 'string', optional: true })
  }

  validateType({ name: 'contract', value: contract, type: 'object', optional: true })

  if (contract) {
    const { methodName, parameters } = contract
    validateType({ name: 'methodName', value: methodName, type: 'string', optional: true })
    validateType({ name: 'parameters', value: parameters, type: 'array', optional: true })
  }
}

function isAddress(address: string): boolean {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address)
}

function validTxHash(hash: string): boolean {
  return /^0x([A-Fa-f0-9]{64})$/.test(hash)
}
