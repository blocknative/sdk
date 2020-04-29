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
  Unsubscribe,
  Destroy
} from './interfaces'

const DEFAULT_NAME = 'unknown'
const DEFAULT_SYSTEM = 'ethereum'

class Blocknative {
  private _storageKey: string
  private _connectionId: string | undefined
  private _dappId: string
  private _system: string
  private _networkId: number
  private _transactionHandlers: TransactionHandler[]
  private _socket: any
  private _connected: boolean
  private _sendMessage: (msg: EventObject) => void
  private _watchedTransactions: Tx[]
  private _watchedAccounts: Ac[]
  private _pingTimeout?: NodeJS.Timeout
  private _heartbeat?: () => void
  private _destroyed: boolean

  public transaction: Transaction
  public account: Account
  public event: Event
  public unsubscribe: Unsubscribe
  public destroy: Destroy

  constructor(options: InitializationOptions) {
    validateOptions(options)
    const {
      dappId,
      system = DEFAULT_SYSTEM,
      name = DEFAULT_NAME,
      networkId,
      transactionHandlers = [],
      apiUrl,
      ws,
      onopen,
      ondown,
      onreopen,
      onerror,
      onclose
    } = options

    const socket = new SturdyWebSocket(
      apiUrl || 'wss://api.blocknative.com/v0',
      ws
        ? {
            wsConstructor: ws
          }
        : {}
    )

    socket.onopen = onOpen.bind(this, onopen)
    socket.ondown = onDown.bind(this, ondown)
    socket.onreopen = onReopen.bind(this, onreopen)
    socket.onmessage = handleMessage.bind(this)
    socket.onerror = (error: any) => onerror && onerror(error)
    socket.onclose = () => {
      this._pingTimeout && clearInterval(this._pingTimeout)
      onclose && onclose()
    }

    const storageKey = CryptoEs.SHA1(`${dappId} - ${name}`).toString()
    const storedConnectionId =
      typeof window !== 'undefined' && window.localStorage.getItem(storageKey)

    this._storageKey = storageKey
    this._connectionId = storedConnectionId || undefined
    this._dappId = dappId
    this._system = system
    this._networkId = networkId
    this._transactionHandlers = transactionHandlers
    this._socket = socket
    this._connected = false
    this._sendMessage = sendMessage.bind(this)
    this._watchedTransactions = []
    this._watchedAccounts = []
    this._pingTimeout = undefined
    this._destroyed = false

    if (this._socket.ws.on) {
      this._heartbeat = () => {
        this._pingTimeout && clearTimeout(this._pingTimeout)

        this._pingTimeout = setTimeout(() => {
          // terminate connection if we haven't heard the server ping after server timeout plus conservative latency delay
          // Sturdy Websocket will handle the new connection logic
          this._socket.ws.terminate()
        }, 30000 + 1000)
      }

      this._socket.ws.on('ping', () => {
        this._heartbeat && this._heartbeat()
      })
    }

    // public API
    this.transaction = transaction.bind(this)
    this.account = account.bind(this)
    this.event = event.bind(this)
    this.unsubscribe = unsubscribe.bind(this)
    this.destroy = () => {
      this._socket.close()
      this._destroyed = true
    }
  }
}

function onOpen(this: any, handler: (() => void) | undefined) {
  this._connected = true
  this._sendMessage({
    categoryCode: 'initialize',
    eventCode: 'checkDappId',
    connectionId: this._connectionId
  })

  this._heartbeat && this._heartbeat()
  handler && handler()
}

function onDown(
  this: any,
  handler: ((closeEvent: CloseEvent) => void) | undefined,
  closeEvent: CloseEvent
) {
  this._connected = false

  if (handler) {
    handler(closeEvent)
  }

  this._pingTimeout && clearTimeout(this._pingTimeout)
}

function onReopen(this: any, handler: (() => void) | undefined) {
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

  if (handler) {
    handler()
  }

  if (this._socket.ws.on) {
    // need to re-register ping event since new connection
    this._socket.ws.on('ping', () => {
      this._heartbeat && this._heartbeat()
    })

    this._heartbeat()
  }
}

export default Blocknative
