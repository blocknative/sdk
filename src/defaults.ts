export const networks: { [key: string]: { [key: string]: string } } = {
  ethereum: {
    '1': 'main',
    '3': 'ropsten',
    '4': 'rinkeby',
    '5': 'goerli',
    '100': 'xdai',
    '137': 'matic-main',
    '80001': 'matic-mumbai'
  }
}

export const DEPRECATED_NETWORK_IDS = [2, 42, 56, 250]

export const DEFAULT_RATE_LIMIT_RULES = {
  points: 150,
  duration: 1
}

export const QUEUE_LIMIT = 10000
