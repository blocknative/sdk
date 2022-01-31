export const networks: { [key: string]: { [key: string]: string } } = {
  bitcoin: {
    '1': 'main',
    '2': 'testnet'
  },
  ethereum: {
    '1': 'main',
    '3': 'ropsten',
    '4': 'rinkeby',
    '5': 'goerli',
    '42': 'kovan',
    '56': 'bsc-main',
    '100': 'xdai',
    '137': 'matic-main',
    '250': 'fantom-main'
  }
}

export const DEFAULT_RATE_LIMIT_RULES = {
  points: 150,
  duration: 1
}

export const QUEUE_LIMIT = 10000
