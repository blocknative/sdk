# Blocknative sdk

A lightweight JavaScript sdk to connect to the Blocknative backend Ethereum node infrastructure via a websocket connection for realtime transaction updates.

## Usage

### Installation

`npm i bnc-sdk`

### Quick Start

```javascript
import blocknativeSdk from 'bnc-sdk'

// create options object
const options = {
  dappId: 'Your dappId here',
  networkId: '1',
  transactionHandlers: [event => console.log(event.transaction)]
}

// initialize and connect to the api
const blocknative = blocknativeSdk(options)

// get the client index from initialization
const { clientIndex } = blocknative

// initiate a transaction via web3.js
const hash = await web3.eth.sendTransaction(txOptions)

// call with the transaction hash of the transaction that you would like to receive status updates for
const transaction = blocknative.transaction(clientIndex, hash)

// grab the emitter
const emitter = transaction.emitter

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

### Options

The following options object needs to be passed when initializing and connecting

```javascript
const options = {
  dappId: String,
  networkId: Number,
  transactionHandlers: Array,
  ws: Function
}
```

#### `dappId` - [REQUIRED]

Your unique apiKey that identifies your application. You can generate a dappId by visiting the [Blocknative account page](https://account.blocknative.com/) and create a free account.

#### `networkId` - [REQUIRED]

The Ethereum network id that your application runs on. The following values are valid:

- `1` Main Network
- `3` Ropsten Test Network
- `4` Rinkeby Test Network
- `5` Goerli Test Network
- `42` Kovan Test Network

#### `transactionHandlers` - [OPTIONAL]

An array of functions that will each be called once for every status update for _every_ transaction that is associated with this connection on a watched address _or_ a watched transaction. This is useful as a global handler for all transactions and status updates. Each callback is called with the following object:

```javascript
const options = {
  // other options
  transactionHandlers: [
    event => {
      const {
        transaction, // transaction object
        emitterResult // data that is returned from the transaction event listener defined on the emitter
      } = event
    }
  ]
}
```

See the [Transaction Object](#transaction-object) section for more info on what is included in the `transaction` parameter.

#### `ws` - [OPTIONAL]

If you are running the sdk in a server environment, there won't be a native websocket instance available for the `sdk` to use so you will need to pass one in. You can use any websocket library that you prefer as long as it correctly implements the websocket specifications. We recommend [ws](https://github.com/websockets/ws)

### Initialize and Connect

#### (Client/Browser Environment)

```javascript
import blocknativeSdk from 'bn-sdk'

// create options object
const options = {
  dappId: 'Your dappId here',
  networkId: 1,
  transactionHandlers: [event => console.log(event.transaction)]
}

// initialize and connect to the api
const blocknative = blocknativeSdk(options)
```

#### (Server/Node.js Environment)

```javascript
import blocknativeSdk from 'bn-sdk'
import ws from 'ws'

// create options object
const options = {
  dappId: 'Your dappId here',
  networkId: 1,
  transactionHandlers: [event => console.log(event.transaction)],
  ws: ws
}

// initialize and connect to the api
const blocknative = blocknativeSdk(options)
```

### Register a Transaction

Now that your application is successfully connected via a websocket connection to the Blocknative backend, you can now register transactions that you would like updates for. Once you have initiated a transaction and have received the transaction hash, you can pass it in to the `transaction` function. The transaction function requires the `clientIndex` that is a parameter on the instantiated `blocknative` object as the first parameter. This is needed to make sure that the `sdk` instance gets the correct notifications.

```javascript
// initiate a transaction via web3.js
const hash = await web3.eth.sendTransaction(txOptions)

// call with the transaction hash of the transaction that you would like to receive status updates for
const {
  emitter, // emitter object to listen for status updates
  details // initial transaction details which are useful for internal tracking: hash, timestamp, eventCode
} = blocknative.transaction(blocknative.clientIndex, hash)
```

Check out the [Emitter Section](#emitter) for details on the `emitter` object

This will tell the Blocknative backend to watch for status updates for that transaction hash. The return object from successful calls to `transaction` will include an event emitter that you can use to listen for particular events for that transaction and the initial details of that transaction.

### Register a Account

You can also register an account address to listen to any incoming and outgoing transactions that occur on that address. The address function requires the `clientIndex` that is a parameter on the instantiated `blocknative` object as the first parameter. This is needed to make sure that the `sdk` instance gets the correct notifications.

```javascript
// get the current accounts list of the user via web3.js
const accounts = await web3.eth.getAccounts()

// grab the primary account
const address = accounts[0]

// call with the address of the account that you would like to receive status updates for
const {
  emitter, // emitter object to listen for status updates
  details // initial account details which are useful for internal tracking: address
} = blocknative.account(blocknative.clientIndex, address)
```

Check out the [Emitter Section](#emitter) for details on the `emitter` object

This will tell the Blocknative backend to watch for any transactions that occur involving this address and any updates to the transaction status over time. The return object from successful calls to `account` will include an event emitter that you can use to listen for those events and a details object which includes the `address` that is being watched:

### Log an Event

You may want to log an event that isn't associated with a transaction for analytics purposes. Events are collated and displayed in the developer portal and are segmented by your `dappId`. To log an event, simple call `event` with a `categoryCode` and an `eventCode`, both of which can be any `String` that you like:

```javascript
blocknative.event({
  categoryCode: String, // [REQUIRED] - The general category of the event
  eventCode: String // [REQUIRED] - The specific event
})
```

### Emitter

The emitter object is returned from calls to `account` and `transaction` and is used to listen to status updates via callbacks registered for specific event codes.

```javascript
// register a callback for a txPool event
emitter.on('txPool', transaction => {
  console.log('Transaction is pending')
})
```

The first parameter is the `eventCode` string of the event that you would like to register a callback for. For a list of the valid event codes, see the section on [event codes](#event-codes).

The second parameter is the callback that you would like to register to handle that event and will be called with a transaction object that includes all of the relevant details for that transaction. See the [Transaction Object](#transaction-object) section for more info on what is included.

Any data that is returned from the listener callback for `transaction` emitters will be included in the object that the global `transactionHandlers` functions will be called with under the `emitterResult` property.

#### Transaction Object

The callback that is registered for events on the emitter will be called with the following transaction object:

```javascript
{
  status: String, // current status of the transaction
  hash: String, // transaction hash
  to: String, // the address the transaction is being sent to
  from: String, // the address the transaction is being sent from
  gas: Number, // the gas in wei
  gasPrice: String, // the gasPrice in wei
  nonce: Number, // the nonce of the transaction
  value: String, // the value being sent
  eventCode: String, // the event code for this status
  blockHash: String, // the hash of the block that this transaction was included in
  blockNumber: Number, // the block number of the block that this transaction was included in
  input: String, // hex string of the input data
  transactionIndex: Number, // same as the nonce
  r: String, // transaction signature
  s: String, // transaction signature
  v: String, // transaction signature
  counterParty: String, // address of the counterparty of the transaction when watching an account
  direction: String, // the direction of the transaction in relation to the account that is being watched ("incoming" or "outgoing")
  watchedAddress: String, // the address of the account being watched
  originalHash: String, // if a speedup or cancel status, this will be the hash of the original transaction
  asset: String, // the asset that was transfered
  contractCall: { // if transaction was a contract call otherwise undefined
    contractAddress: String, // the address of the contract that has been called
    contractType: String, // the contract type eg: ERC20, ERC721
    methodName: String, // the name of the method that was called
    params: {
      // params that the contract method was called with
    }
  }
}
```

#### Event Codes

The following is a list of event codes that are valid, and the events that they represent:

- `all`: Will be called for all events that are associated with that emitter. If a more specific listener exists for that event, then that will be called instead. This is useful to catch any remaining events that you haven't specified a handler for
- `txPool`: Transaction is in the mempool and is pending
- `txConfirmed`: Transaction has been mined
- `txFailed`: Transaction has failed
- `txSpeedUp`: A new transaction has been submitted with the same nonce and a higher gas price, replacing the original transaction
- `txCancel`: A new transaction has been submitted with the same nonce, a higher gas price, a value of zero and sent to an external address (not a contract)
- `txDropped`: Transaction was dropped from the mempool without being added to a block
