import { Subject } from 'rxjs'
import { SimulationTransactionOutput } from './interfaces'

export const simulations$ = new Subject<SimulationTransactionOutput>()
