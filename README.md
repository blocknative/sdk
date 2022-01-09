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
