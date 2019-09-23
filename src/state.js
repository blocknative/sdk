export let session = {
  socket: null,
  pendingSocketConnection: false,
  socketConnection: false,
  networkId: null,
  dappId: null,
  connectionId: undefined,
  transactionListeners: null,
  status: {
    nodeSynced: true,
    connected: null
  },
  transactions: [],
  accounts: []
}
