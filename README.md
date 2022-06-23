# Blocknative sdk

A lightweight JavaScript sdk to connect to the Blocknative backend Ethereum node infrastructure via a websocket connection for realtime transaction updates.

## Usage

### Installation

`npm install bnc-sdk`

### Quick Start (Node.js)

#### Transaction Monitor

```javascript
import WebSocket from 'ws'
import BlocknativeSdk from 'bnc-sdk'
import Web3 from 'web3'

const web3 = new Web3('<ws://some.local-or-remote.node:8546>')

// create options object
const options = {
  dappId: '<YOUR_API_KEY>',
  networkId: 4,
  ws: WebSocket
  // un-comment if you would like to log all transaction events
  // transactionHandlers: [event => console.log(event.transaction)]
}

// initialize and connect to the api
const blocknative = new BlocknativeSdk(options)

const txOptions = {
  to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  value: 1000000000000000
}

// initiate a transaction via web3.js
web3.eth.sendTransaction(txOptions).on('transactionHash', hash => {
  // call with the transaction hash of the transaction that you would like to receive status updates for
  const { emitter } = blocknative.transaction(hash)

  // listen to some events
  emitter.on('txPool', transaction => {
    console.log(`Sending ${transaction.value} wei to ${transaction.to}`)
  })

  emitter.on('txConfirmed', transaction => {
    console.log('Transaction is confirmed!')
  })

  // catch every other event that occurs and log it
  emitter.on('all', transaction => {
    console.log(`Transaction event: ${transaction.eventCode}`)
  })
})
```

#### Address Listener

```javascript
import WebSocket from 'ws'
import BlocknativeSdk from 'bnc-sdk'
import Web3 from 'web3'

const web3 = new Web3('<ws://some.local-or-remote.node:8546>')

// create options object
const options = {
  dappId: '<YOUR_API_KEY>',
  networkId: 4,
  ws: WebSocket
  // un-comment if you would like to log all transaction events
  // transactionHandlers: [event => console.log(event.transaction)]
}

// initialize and connect to the api
const blocknative = new BlocknativeSdk(options)

const address = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

const { emitter, details } = blocknative.account(address)

emitter.on('all', transaction => {
  console.log(transaction)
})
```

### Quick Start (Browser)

#### Transaction Monitor

```javascript
import BlocknativeSdk from 'bnc-sdk'
import Web3 from 'web3'

const web3 = new Web3(window.ethereum)

// create options object
const options = {
  dappId: '<YOUR_API_KEY>',
  networkId: 4
  // un-comment if you would like to log all transaction events
  // transactionHandlers: [event => console.log(event.transaction)]
}

// initialize and connect to the api
const blocknative = new BlocknativeSdk(options)

const txOptions = {
  to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  value: 1000000000000000
}

// initiate a transaction via web3.js
web3.eth.sendTransaction(txOptions).on('transactionHash', hash => {
  // call with the transaction hash of the transaction that you would like to receive status updates for
  const { emitter } = blocknative.transaction(hash)

  // listen to some events
  emitter.on('txPool', transaction => {
    console.log(`Sending ${transaction.value} wei to ${transaction.to}`)
  })

  emitter.on('txConfirmed', transaction => {
    console.log('Transaction is confirmed!')
  })

  // catch every other event that occurs and log it
  emitter.on('all', transaction => {
    console.log(`Transaction event: ${transaction.eventCode}`)
  })
})
```

#### Address Listener

```javascript
import BlocknativeSdk from 'bnc-sdk'
import Web3 from 'web3'

const web3 = new Web3(window.ethereum)

// create options object
const options = {
  dappId: '<YOUR_API_KEY>',
  networkId: 4
  // un-comment if you would like to log all transaction events
  // transactionHandlers: [event => console.log(event.transaction)]
}

// initialize and connect to the api
const blocknative = new BlocknativeSdk(options)

const address = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

const { emitter, details } = blocknative.account(address)

emitter.on('all', transaction => {
  console.log(transaction)
})
```

## Documentation

For detailed documentation head to [docs.blocknative.com](https://docs.blocknative.com/notify-sdk)

## Multichain SDK (experimental new beta API that may break until it is finalized)

For apps that operate on multiple chains at once, you can use the Multichain SDK which provides a simple interface that abstracts away handling multiple WS connections at once and has a new API for subscribing to events.

## Subscribing to events

Currently a transaction hash or account address can be subscribed to for all events. The `subscribe` method requires an `id`, `chainId` and a `type` and returns an `Observable`. The `Observable` that is returned is specific for events on this subscription and on completion or unsubscribing from the observable will automatically unsubscribe within the SDK. Alternatively you can listen on the global transactions `Observable` at `sdk.transactions$`.

```javascript
import Blocknative from 'bnc-sdk'

const blocknative = Blocknative.multichain({ apiKey: '<YOUR_API_KEY>' })

// subscribe to address events
const addressSubscription = blocknative.subscribe({
  id: '0x32ee303b76B27A1cd1013DE2eA4513aceB937c72',
  chainId: '0x1',
  type: 'account'
})

// can listen to the address subscription directly
addressSubscription.subscribe(transaction => console.log(transaction))

// subscribe to transaction events
const transactionSubscription = blocknative.subscribe({
  id: '0xbb1af436fd539a6282c6f45ed900abb5ac95ec435367f61fa8815a61bd2a7211',
  chainId: '0x1',
  type: 'transaction'
})

// can listen to the transaction subscription directly
transactionSubscription.subscribe(transaction => console.log(transaction))

// or can listen for all transaction events on the global transactions$ observable
blocknative.transaction$.subscribe(transaction => console.log(transaction))
```

## Unsubscribing

To stop listening to events on a transaction hash or account address, call the `unsubscribe` method. If called without a `chainId`, all networks will unsubscribe from the transaction or address. To only unsubscribe on a particular network, pass in the `chainId` of that network.

```javascript
blocknative.unsubscribe({
  id: 'transactionHashOrAddress',
  chainId: '0x1'
})
```
