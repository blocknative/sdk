import { Subject } from 'rxjs'

export interface NotificationObject {
  type?: 'pending' | 'success' | 'error' | 'hint'
  message?: string
  autoDismiss?: number
  onclick?: (event: any) => void
  eventCode?: string
}

export interface ContractCall {
  methodName: string
  params: {
    [key: string]: string
  }
  contractAddress?: string
  contractType?: string
  contractDecimals: number
  contractName: string
  decimalValue: string
}

export interface CommonTransactionData {
  system: System
  network: Network
  status: Status
  id?: string
  eventCode: string
  timeStamp: string
  serverVersion: string
  monitorId: string
  monitorVersion: string
}

export interface BitcoinTransactionData extends CommonTransactionData {
  txid: string
  inputs: InputOutput[]
  outputs: InputOutput[]
  fee: string
  netBalanceChanges: BalanceChange[]
  rawTransaction: BitcoinRawTransaction
}

export interface EthereumTransactionData extends CommonTransactionData {
  hash: string
  asset: string
  blockHash: string
  blockNumber: number
  contractCall: ContractCall
  to: string
  from: string
  gas: string
  gasPrice: string
  gasUsed?: string
  input: string
  nonce: number
  v: string
  r: string
  s: string
  transactionIndex: number
  value: string
  startTime?: number
  timePending?: string
  watchedAddress?: string
  replaceHash?: string
  counterparty?: string
  direction?: string
}

export type TransactionData = BitcoinTransactionData | EthereumTransactionData

export interface TransactionEvent {
  emitterResult: void | boolean | NotificationObject
  transaction: TransactionData | TransactionEventLog
}

export type System = 'bitcoin' | 'ethereum'
export type Network =
  | 'main'
  | 'testnet'
  | 'ropsten'
  | 'rinkeby'
  | 'goerli'
  | 'kovan'
  | 'xdai'
  | 'local'

export type Status =
  | 'pending'
  | 'confirmed'
  | 'speedup'
  | 'cancel'
  | 'failed'
  | 'dropped'

export interface InputOutput {
  address: string
  value: string
}

export interface BalanceChange {
  address: string
  delta: string
}

export interface BitcoinRawTransaction {
  txid: string
  hash: string
  version: number
  size: number
  vsize: number
  weight: number
  locktime: number
  vin: Vin[]
  vout: Vout[]
  hex: string
}

export interface Vin {
  txid: string
  vout: number
  scriptSig: {
    asm: string
    hex: string
  }
  txinwitness: string[]
  sequence: number
}

export interface Vout {
  value: number
  n: number
  scriptPubKey: {
    asm: string
    hex: string
    reqSigs: number
    type: string
    addresses: string[]
  }
}

export interface InitializationOptions {
  networkId: number
  dappId: string
  system?: System
  name?: string
  transactionHandlers?: TransactionHandler[]
  apiUrl?: string
  ws?: any
  onopen?: () => void
  ondown?: (closeEvent: CloseEvent) => void
  onreopen?: () => void
  onerror?: (error: SDKError) => void
  onclose?: () => void
}

export interface SDKError {
  message: string
  error?: any
  account?: string
  transaction?: string
}

export interface Emitter {
  listeners: {
    [key: string]: EmitterListener
  }
  on: (eventCode: TransactionEventCode, listener: EmitterListener) => void
  off: (eventCode: TransactionEventCode) => void
  emit: (
    state: TransactionData | TransactionEventLog
  ) => boolean | void | NotificationObject
}

export type TransactionEventCode =
  | 'txSent'
  | 'txPool'
  | 'txConfirmed'
  | 'txSpeedUp'
  | 'txCancel'
  | 'txFailed'
  | 'txRequest'
  | 'nsfFail'
  | 'txRepeat'
  | 'txAwaitingApproval'
  | 'txConfirmReminder'
  | 'txSendFail'
  | 'txError'
  | 'txUnderPriced'
  | 'all'

export interface Ac {
  address: string
  emitters: Emitter[]
}

export interface Tx {
  hash: string
  emitter: Emitter
}

export interface BaseTransactionLog {
  id: string
  startTime?: number
  status: string
  eventCode: string
}

export interface EthereumTransactionLog extends BaseTransactionLog {
  hash: string
  from?: string
  to?: string
  value?: number | string
  gas?: string
  gasPrice?: string
  nonce?: number
}

export interface BitcoinTransactionLog extends BaseTransactionLog {
  txid?: string
  [key: string]: string | number | undefined
}

export type TransactionEventLog = EthereumTransactionLog | BitcoinTransactionLog

export interface EventObject {
  eventCode: string
  categoryCode: string
  transaction?: TransactionEventLog
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
  (state: TransactionData | TransactionEventLog):
    | boolean
    | undefined
    | NotificationObject
    | void
}

export interface Config {
  scope: string
  filters?: string[]
  abi?: any[]
  watchAddress?: boolean
}

export interface EnhancedConfig extends Config {
  emitter?: Emitter
  subscription?: Subject<string>
}

export interface Transaction {
  (hash: string, id?: string): {
    details: BitcoinTransactionLog | EthereumTransactionLog
    emitter: Emitter
  }
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

export interface Destroy {
  (): void
}

export interface Configuration {
  (config: Config): Promise<
    { details: { config: Config }; emitter?: Emitter } | string
  >
}

export interface API {
  transaction: Transaction
  account: Account
  event: Event
  unsubscribe: Unsubscribe
  destroy: Destroy
  config: Configuration
}

export interface LimitRules {
  points: number
  duration: number
}
