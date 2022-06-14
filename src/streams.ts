import { Subject } from 'rxjs'
import { SimulationTransactionOutput } from './types'

export const simulations$ = new Subject<SimulationTransactionOutput>()
