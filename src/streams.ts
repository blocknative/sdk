import { Subject } from 'rxjs'
import { EthereumTransactionData, SimulationTransactionOutput, SimulationTransaction } from './interfaces'

export const simulations$ = new Subject<SimulationTransactionOutput>()
