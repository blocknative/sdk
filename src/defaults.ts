export const networks: { [key: string]: { [key: string]: string } } = {
  ethereum: {
    '1': 'main',
    '5': 'goerli',
    '11155111': 'sepolia',
    '100': 'xdai',
    '137': 'matic-main',
    '80001': 'matic-mumbai'
  }
}

export const DEPRECATED_NETWORK_IDS = [2, 3, 4, 42, 56, 250]

export const DEFAULT_RATE_LIMIT_RULES = {
  points: 150,
  duration: 1
}

export const QUEUE_LIMIT = 10000
