export let session = {
  socket: null,
  pendingSocketConnection: false,
  socketConnection: false,
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
