import { Subject } from 'rxjs'
import { MultiSimOutput, SimulationTransactionOutput } from './types'

export const simulations$ = new Subject<{
  eventId: string
  transaction: SimulationTransactionOutput | MultiSimOutput
}>()
