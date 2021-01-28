# Blocknative sdk

A lightweight JavaScript sdk to connect to the Blocknative backend Ethereum node infrastructure via a websocket connection for realtime transaction updates.

## Usage

### Installation

`npm install bnc-sdk`

### Quick Start (client)

```javascript
import BlocknativeSdk from 'bnc-sdk'
import Web3 from 'web3'

const web3 = new Web3(window.ethereum)

// create options object
const options = {
  dappId: 'Your dappId here',
  networkId: 1,
  transactionHandlers: [event => console.log(event.transaction)]
}

// initialize and connect to the api
const blocknative = new BlocknativeSdk(options)

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
```

## Documentation

For detailed documentation head to [docs.blocknative.com](https://docs.blocknative.com/notify-sdk)
