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

#### Transaction Preview

#### Overview

Transaction Preview lets you preview the outputs of any custom transactions that you submit to it. By harnessing the power of our network of Ethereum nodes, with our existing decoding and transaction lifecycle knowledge, we hope to give users of Transaction Preview even greater comfort when interacting in the Web3 space. Previewing a transaction is particularly useful for:
Wallets: Help users preview net-balance changes & identify malicious contract behavior or buggy smart contracts before interacting with them.
DEXs & Swaps: Report accurate slippage, Accurate tokens received, and accurate failing calls
Traders: Preview many iterations of the same trade and execute only the most profitable one
Lending Protocols: Tell whether a Borrow / Repay / Claim transaction will go through
Auctions: Tell whether your bid or listing will go through and its accuracy & effects
NFTs: Tell whether your NFT mint, purchase, or transfer will go through
& much more without spending a single wei in gas!

#### Supported Networks

Transaction Preview is currently only supported for **Ethereum: Main**. Please stay tuned for its availability on other networks supported by Blocknative.

#### Rate Limits

Usage rate limit for the Transaction Preview API is 100 requests per 60-second window. Transaction Preview consumes the same daily limits on your Blocknative plan as pending simulated transactions in Simulation Platform. You can view your current consumption on your Blocknative Account Page.

#### Usage

This example will mock a contract interaction between two wallets.

```typescript
import BlocknativeSdk, { SimulationTransaction, MultiSimOutput } from 'bnc-sdk'
import { SimulationTransaction, MultiSimOutput } from 'bnc-sdk'
import { ethers } from 'ethers'

const addressFrom = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const CONTRACT_ADDRESS = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
const erc20_interface = [
  'function approve(address _spender, uint256 _value) public returns (bool success)',
  'function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) view returns (uint256)'
]

const uniswapV2router_interface = [
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
]

const weth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const dai = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
let swapTxData
let approveTxData
const createTransaction = async () => {
  const swapContract = new ethers.Contract(
    CONTRACT_ADDRESS,
    uniswapV2router_interface
  )
  const erc20_contract = new ethers.Contract(weth, erc20_interface)
  const oneEther = ethers.BigNumber.from('1591000000000000000000')
  approveTxData = await erc20_contract.populateTransaction.approve(
    CONTRACT_ADDRESS,
    oneEther
  )

  const amountOutMin = 0
  const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString())._hex

  const path = [dai, weth]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 1 // 1 minutes from the current Unix time

  const inputAmountHex = oneEther.toHexString()

  swapTxData = await swapContract.populateTransaction.swapExactTokensForETH(
    inputAmountHex,
    amountOutMinHex,
    path,
    addressFrom,
    deadline
  )
}
await createTransaction()
const account_address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const uniswapV2Router = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

const stubTrans = [
  {
    from: account_address,
    to: dai,
    input: approveTxData.data,
    gas: 1000000,
    gasPrice: 48000000000,
    value: 0
  },
  {
    from: account_address,
    to: uniswapV2Router,
    input: swapTxData.data,
    gas: 1000000,
    gasPrice: 48000000000,
    value: 0
  }
]

// create options object
const options = {
  dappId: '<YOUR_API_KEY>',
  networkId: 1
}

// initialize and connect to the api
const blocknativeSDK = new BlocknativeSdk(options)

const singleSim: Promise<SimulationTransactionOutput> = blocknativeSDK.simulate(
  'ethereum',
  'main',
  stubTrans[1]
)

const multiSim: Promise<MultiSimOutput> = blocknativeSDK.multiSim(stubTrans)
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
