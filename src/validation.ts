import { TransactionHandler } from './interfaces'
import { networks } from './config'

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

  if (
    typeof value !== 'undefined' &&
    customValidation &&
    !customValidation(value)
  ) {
    throw new Error(`"${value}" is not a valid "${name}"`)
  }
}

export function validateOptions(options: any): never | void {
  validateType({ name: 'sdk options', value: options, type: 'object' })

  const {
    dappId,
    system,
    name,
    networkId,
    transactionHandlers,
    apiUrl,
    ws,
    ondown,
    onreopen
  } = options

  validateType({ name: 'dappId', value: dappId, type: 'string' })
  validateType({
    name: 'system',
    value: system,
    type: 'string',
    optional: true,
    customValidation: validSystem
  })
  validateType({ name: 'name', value: name, type: 'string', optional: true })
  validateType({ name: 'networkId', value: networkId, type: 'number' })
  validateType({
    name: 'transactionHandler',
    value: transactionHandlers,
    type: 'array',
    optional: true
  })

  if (transactionHandlers) {
    transactionHandlers.forEach((handler: TransactionHandler) =>
      validateType({
        name: 'transactionHandler',
        value: handler,
        type: 'function'
      })
    )
  }

  validateType({
    name: 'apiUrl',
    value: apiUrl,
    type: 'string',
    optional: true
  })
  validateType({ name: 'ws', value: ws, type: 'function', optional: true })
  validateType({
    name: 'ondown',
    value: ondown,
    type: 'function',
    optional: true
  })
  validateType({
    name: 'onreopen',
    value: onreopen,
    type: 'function',
    optional: true
  })
}

export function validSystem(system: string): boolean {
  return !!networks[system]
}
