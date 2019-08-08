# Blocknative API

## API

```javascript
const options = {
  dappId: String, // [REQUIRED]
  networkId: String, // [REQUIRED]
  transactionCallback: Function (called upon every transaction message)
}
blocknative.connect(options)
```

```javascript
const transaction = blocknative.transaction(hash)
console.log(transaction.details)

transaction.emitter.on("txPool", () => {
  // handle txPool event here
})
```
