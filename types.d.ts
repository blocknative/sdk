export as namespace blocknativeSdk

export = sdk

interface transactionCallback {
  (transactionEvent: object): void
}

interface optionsObject {
  networkId: number
  dappId: string
  transactionListeners?: transactionCallback[]
  apiUrl?: string
  ws?: any
}

interface status {
	nodeSynced: boolean;
	connected: boolean;
}

interface sdkApi {
  transaction: (hash: string, id?: string) => any;
  account: (address: string) => any;
  event: (eventObj: object) => void;
  status: status;
}

declare function sdk(options: optionsObject): sdkApi
