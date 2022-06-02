import { validateOptions } from './validation'
import { InitializationOptions } from './types'
import SDK from './sdk'
import MultichainSDK from './multichain'

export * from './types'

class Blocknative {
  constructor(options: InitializationOptions) {
    validateOptions(options)

    if (options.multichain) {
      return new MultichainSDK(options)
    } else {
      return new SDK(options)
    }
  }
}

export default Blocknative
