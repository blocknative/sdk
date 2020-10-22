import { TransactionHandler } from './interfaces'
import { networks } from './defaults'

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
    onopen,
    ondown,
    onreopen,
    onerror,
    onclose,
    ...otherParams
  } = options

  invalidParams(
    otherParams,
    [
      'dappId',
      'system',
      'name',
      'networkId',
      'transactionHandlers',
      'apiUrl',
      'ws',
      'onopen',
      'ondown',
      'onreopen',
      'onerror',
      'onclose'
    ],
    'Initialization Options'
  )

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
    name: 'onopen',
    value: onopen,
    type: 'function',
    optional: true
  })

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

  validateType({
    name: 'onerror',
    value: onerror,
    type: 'function',
    optional: true
  })

  validateType({
    name: 'onclose',
    value: onclose,
    type: 'function',
    optional: true
  })
}

export function validSystem(system: string): boolean {
  return !!networks[system]
}

function invalidParams(
  params: object,
  validParams: string[],
  functionName: string
): void | never {
  const invalid = Object.keys(params)

  if (invalid.length > 0) {
    throw new Error(
      `${
        invalid[0]
      } is not a valid parameter for ${functionName}, must be one of the following valid parameters: ${validParams.join(
        ', '
      )}`
    )
  }
}
