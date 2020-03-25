import SturdyWebSocket from 'sturdy-websocket'
import CryptoEs from 'crypto-es'

import transaction from './transaction'
import account from './account'
import event from './event'
import unsubscribe from './unsubscribe'

import { sendMessage, handleMessage } from './messages'
import { validateOptions } from './validation'

import {
  InitializationOptions,
  Ac,
  TransactionHandler,
  EventObject,
  Tx,
  Transaction,
  Account,
  Event,
  Unsubscribe
} from './interfaces'

const DEFAULT_NAME = 'unknown'

class Blocknative {
  private _storageKey: string
  private _connectionId: string | undefined
  private _dappId: string
  private _networkId: number
  private _transactionHandlers: TransactionHandler[]
  private _socket: any
  private _connected: boolean
  private _sendMessage: (msg: EventObject) => void
  private _watchedTransactions: Tx[]
  private _watchedAccounts: Ac[]

  public transaction: Transaction
  public account: Account
  public event: Event
  public unsubscribe: Unsubscribe

  constructor(options: InitializationOptions) {
    validateOptions(options)
    const {
      dappId,
      name = DEFAULT_NAME,
      networkId,
      transactionHandlers = [],
      apiUrl,
      ws
    } = options

    const socket = new SturdyWebSocket(
      apiUrl || 'wss://staging.api.blocknative.com/v0',
      ws
        ? {
            wsConstructor: ws
          }
        : {}
    )

    socket.onopen = onOpen.bind(this)
    socket.ondown = onDown.bind(this)
    socket.onreopen = onReopen.bind(this)
    socket.onmessage = handleMessage.bind(this)

    const storageKey = CryptoEs.SHA1(`${dappId} - ${name}`).toString()
    const storedConnectionId =
      typeof window !== 'undefined' && window.localStorage.getItem(storageKey)

    this._storageKey = storageKey
    this._connectionId = storedConnectionId || undefined
    this._dappId = dappId
    this._networkId = networkId
    this._transactionHandlers = transactionHandlers
    this._socket = socket
    this._connected = false
    this._sendMessage = sendMessage.bind(this)
    this._watchedTransactions = []
    this._watchedAccounts = []

    // public API
    this.transaction = transaction.bind(this)
    this.account = account.bind(this)
    this.event = event.bind(this)
    this.unsubscribe = unsubscribe.bind(this)
  }
}

function onOpen(this: any) {
  this._connected = true
  this._sendMessage({
    categoryCode: 'initialize',
    eventCode: 'checkDappId',
    connectionId: this._connectionId
  })
}

function onDown(this: any) {
  this._connected = false
}

function onReopen(this: any) {
  this._connected = true

  this._sendMessage({
    categoryCode: 'initialize',
    eventCode: 'checkDappId',
    connectionId: this._connectionId
  })

  // re-register all accounts to be watched by server upon
  // re-connection as they don't get transferred over automatically
  // to the new connection like tx hashes do
  this._watchedAccounts.forEach((account: Ac) => {
    this._sendMessage({
      eventCode: 'accountAddress',
      categoryCode: 'watch',
      account: {
        address: account.address
      }
    })
  })
}

export default Blocknative
