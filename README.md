# Blocknative API

## Usage

### Options

The following options object needs to be passed when initializing and connecting

```javascript
const options = {
  dappId: String, // [REQUIRED] - Sign up for an account at blocknative.com
  networkId: String, // [REQUIRED] - The id of the ethereum network your app runs on
  transactionCallback: Function // [OPTIONAL] - See below for details
  ws: Function // [OPTIONAL] - A valid websocket instance. Pass this in if you are running the sdk on a server
}
```

#### transactionCallback parameter

The function defined for the `transactionCallback` parameter will be called once for every status update for _every_ transaction that is associated with this connection on a watched address _or_ a watched transaction. This is useful as a global handler for all transactions and status updates. The callback is called with the following object:

```javascript
{
  transaction, // transaction object - see below for details
    emitterResult // data that is returned from the event listener defined on the emitter
}
```

#### ws parameter

If you are running the sdk on a server then there will not be a websocket instance available for the sdk to use so you will need to pass one in. You can use any websocket library that you prefer as long as it matches the websocket specifications. We recommend [this library](https://github.com/websockets/ws)

### Initialize and Connect

```javascript
import BlocknativeSdk from "./bn-sdk"

// initialize and connect to the api
const blocknative = new BlocknativeSdk(options)
```

### Register a Transaction

```javascript
// call with the transaction hash of the transaction that you would like to receive status updates for
const transaction = blocknative.transaction(hash)
```

The return object from `transaction`:

```javascript
{
  emitter, // emitter object to listen for status updates (see below for details)
  details // initial transaction details which are useful for internal tracking: hash, timestamp, eventCode
}
```

### Register a Account

```javascript
// call with the address of the account that you would like to receive status updates for
const account = blocknative.account(address)
```

The return object from `account`:

```javascript
{
  emitter, // emitter object to listen for status updates (see below for details)
  details // initial account details which are useful for internal tracking: address
}
```

### Log an Event

You may want to log an event that isn't associated with a transaction for analytics purposes:

```javascript
blocknative.event({
  categoryCode: String, // [REQUIRED] - The general category of the event
  eventCode: String // [REQUIRED] - The specific event
})
```

### Emitter

The emitter object is returned from calls to `account` and `transaction` and is used to listen to status updates via callbacks registered for specific event codes. Below is an example of how to use the emitter object:

```javascript
// register a callback for a txPool event. See below for full list of eventCodes
emitter.on("txPool", transaction => {
  // do something with transaction update
})
```

Any data that is returned from the listener callback will be included in the object that the global `transactionCallback` is called with under the `emitterResult` property.

#### Transaction Object

The callback that is registered for events on the emitter will be called with the following transaction object:

```javascript
{
  status: String, // current status of the transaction
  hash: String,
  to: String,
  from: String,
  gas: Number,
  gasPrice: String,
  nonce: Number,
  value: String,
  eventCode: String,
  blockHash: String,
  blockNumber: Number,
  input: String,
  transactionIndex: Number,
  r: String,
  s: String,
  v: String,
  counterParty: String, // address of the counterparty of the transaction when watching an account
  direction: String, // the direction of the transaction in relation to the account that is being watched ("incoming" or "outgoing")
  watchedAddress: String, // the address of the account being watched
  originalHash: String, // if a speedup or cancel status, this will be the hash of the original transaction
  asset: String, // the asset that was transfered
  contractCall: { // if transaction was a contract call otherwise undefined
    contractAddress: String,
    contractType: String,
    methodName: String,
    params: {
      // params that the contract method was called with
    }
  }
}
```

#### Event Codes

The following is a list of event codes that are valid, and the events that they represent:

- `txPool`: Transaction is in the mempool and is pending
- `txConfirmed`: Transaction has been mined
- `txFailed`: Transaction has failed
- `txSpeedUp`: A new transaction has been submitted with the same nonce and a higher gas price, replacing the original transaction
- `txCancel`: A new transaction has been submitted with the same nonce, a higher gas price, a value of zero and sent to an external address (not a contract)
- `txDropped`: Transaction was dropped from the mempool without being added to a block
