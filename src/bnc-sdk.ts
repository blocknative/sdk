import SturdyWebSocket from 'sturdy-websocket'

import transaction from './transaction'
import account from './account'
import event from './event'
import unsubscribe from './unsubscribe'

import { sendMessage, handleMessage } from './messages'
import { session } from './state'

import { InitializationOptions, Ac, API, Client } from './interfaces'
import { validateOptions } from './validation'

let clientIndex: number = 0

export default function sdk(options: InitializationOptions): API {
  validateOptions(options)

  const { dappId, networkId, transactionHandlers = [], apiUrl, ws } = options
  const alreadyConnected = !!session.socket

  session.dappId = dappId
  session.networkId = networkId
  session.clients.push({
    transactionHandlers,
    transactions: [],
    accounts: []
  })

  if (!alreadyConnected) {
    if (ws) {
      session.socket = new SturdyWebSocket(apiUrl || 'wss://api.blocknative.com/v0', {
        wsConstructor: ws
      })
    } else {
      session.socket = new SturdyWebSocket(apiUrl || 'wss://api.blocknative.com/v0')
    }

    session.socket.onopen = () => {
      session.status.connected = true

      const connectionId =
        (typeof window !== 'undefined' && window.localStorage.getItem('connectionId')) ||
        session.connectionId

      sendMessage({
        categoryCode: 'initialize',
        eventCode: 'checkDappId',
        connectionId
      })
    }

    session.socket.ondown = () => {
      session.status.connected = false
    }

    session.socket.onreopen = () => {
      session.status.connected = true

      const connectionId =
        (typeof window !== 'undefined' && window.localStorage.getItem('connectionId')) ||
        session.connectionId

      sendMessage({
        categoryCode: 'initialize',
        eventCode: 'checkDappId',
        connectionId
      })

      // re-register all accounts to be watched by server upon
      // re-connection as they don't get transferred over automatically
      // to the new connection like tx hashes do
      session.clients.forEach((client: Client) => {
        client.accounts.forEach((account: Ac) => {
          sendMessage({
            eventCode: 'accountAddress',
            categoryCode: 'watch',
            account: {
              address: account.address
            }
          })
        })
      })
    }

    session.socket.onmessage = handleMessage
  }
  return {
    transaction,
    account,
    event,
    unsubscribe,
    status: session.status,
    clientIndex: clientIndex++
  }
}
