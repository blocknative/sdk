export interface NotificationObject {
  type?: string
  message?: string
  autoDismiss?: number
  onclick?: (event: any) => void
  eventCode?: string
}

interface ContractObject {
  contractAddress: string
  contractType: string
  methodName: string
  params: object
}

export interface TransactionData {
  asset?: string
  blockHash?: string
  blockNumber?: number
  contractCall?: ContractObject
  eventCode: string
  from?: string
  gas?: string
  gasPrice?: string
  hash: string
  id: string
  input?: string
  monitorId?: string
  monitorVersion?: string
  nonce?: number
  r?: string
  s?: string
  status: string
  to?: string
  transactionIndex?: number
  v?: string
  value?: string | number
  startTime?: number
  watchedAddress?: string
  originalHash?: string
  counterparty?: string
  direction?: string
}

export interface TransactionEvent {
  emitterResult: void | boolean | NotificationObject
  transaction: TransactionData
}

export interface InitializationOptions {
  networkId: number
  dappId: string
  name?: string
  transactionHandlers?: TransactionHandler[]
  apiUrl?: string
  ws?: any
}

export interface Emitter {
  listeners: {
    [key: string]: EmitterListener
  }
  on: (eventCode: string, listener: EmitterListener) => void
  emit: (state: TransactionData) => boolean | void | NotificationObject
}

export interface Ac {
  address: string
  emitters: Emitter[]
}

export interface Tx {
  hash: string
  emitter: Emitter
}

export interface TransactionLog {
  hash: string
  id: string
  startTime?: number
  status: string
  from?: string
  to?: string
  value?: number | string
  gas?: string
  gasPrice?: string
  nonce?: number
}

export interface EventObject {
  eventCode: string
  categoryCode: string
  transaction?: TransactionLog
  wallet?: {
    balance: string
  }
  contract?: {
    methodName: string
    parameters: any[]
  }
  account?: {
    address: string
  }
  connectionId?: string
}

export interface TransactionHandler {
  (transaction: TransactionEvent): void
}

export interface EmitterListener {
  (state: TransactionData): boolean | undefined | NotificationObject | void
}

export interface Transaction {
  (hash: string, id?: string): { details: TransactionLog; emitter: Emitter }
}

export interface Account {
  (address: string): { details: { address: string }; emitter: Emitter }
}

export interface Event {
  (eventObj: EventObject): void
}

export interface Unsubscribe {
  (addressOrHash: string): void
}

export interface API {
  transaction: Transaction
  account: Account
  event: Event
  unsubscribe: Unsubscribe
}
