import { Subject } from 'rxjs'
import { SimulationTransactionResponse } from './interfaces'

export const simulations$ = new Subject<SimulationTransactionResponse>()
