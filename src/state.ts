import { Session } from './interfaces'

export let session: Session = {
  socket: null,
  pendingSocketConnection: false,
  socketConnection: false,
  networkId: 1,
  dappId: '',
  connectionId: '',
  clients: [],
  status: {
    nodeSynced: true,
    connected: false
  }
}
