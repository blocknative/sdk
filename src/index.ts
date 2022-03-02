import SturdyWebSocket from 'sturdy-websocket'
import CryptoEs from 'crypto-es'

import transaction from './transaction'
import account from './account'
import event from './event'
import simulate from './simulate'
import unsubscribe from './unsubscribe'
import configuration from './configuration'

import {
  sendMessage,
  handleMessage,
  processQueue,
  createEventLog
} from './messages'
import { validateOptions } from './validation'
import { DEFAULT_RATE_LIMIT_RULES } from './defaults'

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
  Destroy,
  Configuration,
  SDKError,
  LimitRules,
  EnhancedConfig
} from './interfaces'
import { isLocalStorageAvailable } from './utilities'

const DEFAULT_APP_NAME = 'unknown'
const DEFAULT_APP_VERSION = 'unknown'
const DEFAULT_SYSTEM = 'ethereum'

class Blocknative {
  private _storageKey: string
  private _connectionId: string | undefined
  private _dappId: string
  private _system: string
  private _networkId: number
  private _appName: string
  private _appVersion: string
  private _transactionHandlers: TransactionHandler[]
  private _socket: any
  private _connected: boolean
  private _sendMessage: (msg: EventObject) => void
  private _watchedTransactions: Tx[]
  private _watchedAccounts: Ac[]
  private _configurations: Map<string, EnhancedConfig>
  private _pingTimeout?: NodeJS.Timeout
  private _heartbeat?: () => void
  private _destroyed: boolean
  private _onerror: ((error: SDKError) => void) | undefined
  private _queuedMessages: EventObject[]
  private _limitRules: LimitRules
  private _waitToRetry: null | Promise<void>
  private _processingQueue: boolean
  private _processQueue: () => Promise<void>

  public transaction: Transaction
  public account: Account
  public event: Event
  public simulate: Simulate
  public unsubscribe: Unsubscribe
  public destroy: Destroy
  public configuration: Configuration

  constructor(options: InitializationOptions) {
    validateOptions(options)

    const {
      dappId,
      system = DEFAULT_SYSTEM,
      name = DEFAULT_APP_NAME,
      appVersion = DEFAULT_APP_VERSION,
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

    // override default timeout to allow for slow connections
    const timeout = { connectTimeout: 10000 }

    const socket = new SturdyWebSocket(
      apiUrl || 'wss://api.blocknative.com/v0',
      ws
        ? {
            wsConstructor: ws,
            ...timeout
          }
        : { ...timeout }
    )

    socket.onopen = onOpen.bind(this, onopen)
    socket.ondown = onDown.bind(this, ondown)
    socket.onreopen = onReopen.bind(this, onreopen)
    socket.onmessage = handleMessage.bind(this)
    socket.onerror = (error: any) =>
      onerror && onerror({ message: 'There was a WebSocket error', error })
    socket.onclose = () => {
      this._pingTimeout && clearInterval(this._pingTimeout)
      onclose && onclose()
    }

    const storageKey = CryptoEs.SHA1(`${dappId} - ${name}`).toString()
    const storedConnectionId =
      isLocalStorageAvailable() && window.localStorage.getItem(storageKey)

    this._storageKey = storageKey
    this._connectionId = storedConnectionId || undefined
    this._dappId = dappId
    this._system = system
    this._networkId = networkId
    this._appName = name
    this._appVersion = appVersion
    this._transactionHandlers = transactionHandlers
    this._socket = socket
    this._connected = false
    this._sendMessage = sendMessage.bind(this)
    this._watchedTransactions = []
    this._watchedAccounts = []
    this._configurations = new Map()
    this._pingTimeout = undefined
    this._destroyed = false
    this._onerror = onerror
    this._queuedMessages = []
    this._limitRules = DEFAULT_RATE_LIMIT_RULES
    this._waitToRetry = null
    this._processingQueue = false
    this._processQueue = processQueue.bind(this)

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
    this.simulate = simulate.bind(this)
    this.unsubscribe = unsubscribe.bind(this)
    this.configuration = configuration.bind(this)
    this.destroy = () => {
      this._socket.close()
      this._destroyed = true

      // call onclose manually here as SturdyWebSocket doesn't currently work as expected
      // https://github.com/dphilipson/sturdy-websocket/issues/5
      this._socket.onclose()
    }
  }
}

function onOpen(this: any, handler: (() => void) | undefined) {
  this._connected = true

  const msg = {
    categoryCode: 'initialize',
    eventCode: 'checkDappId',
    connectionId: this._connectionId
  }

  // send this message directly rather than put in queue
  this._socket.send(createEventLog.bind(this)(msg))
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

async function onReopen(this: any, handler: (() => void) | undefined) {
  this._connected = true

  const msg = {
    categoryCode: 'initialize',
    eventCode: 'checkDappId',
    connectionId: this._connectionId
  }

  this._socket.send(createEventLog.bind(this)(msg))

  // re-register all configurations on re-connection
  const configurations: EnhancedConfig[] = Array.from(
    this._configurations.values()
  )

  // register global config first and wait for it to complete
  const globalConfiguration = this._configurations.get('global')

  if (globalConfiguration) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { emitter, subscription, ...config } = globalConfiguration
      await this.configuration(config)
    } catch (error) {
      console.warn(
        'Error re-sending global configuration upon reconnection:',
        error
      )
    }
  }

  const addressConfigurations = configurations.filter(
    ({ scope }) => scope !== 'global'
  )

  addressConfigurations.forEach((enhancedConfig: EnhancedConfig) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { emitter, subscription, ...config } = enhancedConfig

    this._sendMessage({
      categoryCode: 'configs',
      eventCode: 'put',
      config
    })
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

  if (this._socket.ws && this._socket.ws.on) {
    // need to re-register ping event since new connection
    this._socket.ws.on('ping', () => {
      this._heartbeat && this._heartbeat()
    })

    this._heartbeat()
  }
}

export default Blocknative
