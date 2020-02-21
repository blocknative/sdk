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
  emitterResult: undefined | boolean | NotificationObject
  transaction: TransactionData
}

export interface InitializationOptions {
  networkId: number
  dappId: string
  transactionHandlers?: TransactionHandler[]
  apiUrl?: string
  ws?: any
}

export interface Emitter {
  listeners: {
    [key: string]: EmitterListener
  }
  on: (eventCode: string, listener: EmitterListener) => void
  emit: (state: TransactionData) => boolean | undefined | NotificationObject
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
  (state: TransactionData): boolean | undefined | NotificationObject
}

export interface Session {
  socket: any
  pendingSocketConnection: boolean
  socketConnection: boolean
  networkId: number
  dappId: string
  connectionId: string
  clients: Client[]
  status: {
    nodeSynced: boolean
    connected: boolean
  }
}

interface Transaction {
  (clientIndex: number, hash: string, id?: string): { details: TransactionLog; emitter: Emitter }
}

interface Account {
  (clientIndex: number, address: string): { details: { address: string }; emitter: Emitter }
}

interface Event {
  (eventObj: EventObject): void
}

interface Unsubscribe {
  (clientIndex: number, addressOrHash: string): void
}

interface Status {
  nodeSynced: boolean
  connected: boolean
}

export interface API {
  transaction: Transaction
  account: Account
  event: Event
  unsubscribe: Unsubscribe
  status: Status
  clientIndex: number
}

export interface Client {
  transactionHandlers: TransactionHandler[]
  accounts: Ac[]
  transactions: Tx[]
}
