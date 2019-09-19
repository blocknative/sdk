export let session = {
  socket: null,
  networkId: null,
  dappId: null,
  connectionId: undefined,
  transactionCallback: null,
  status: {
    nodeSynced: true,
    connected: null,
    dropped: false
  },
  transactions: [],
  accounts: []
}
