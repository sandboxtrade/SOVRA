import type { BudgetArea, GameSpeed, PoliticalPolicyId, ProjectId, TaxId } from '../../../shared/gameActions'

export type { BudgetArea, GameSpeed, PoliticalPolicyId, ProjectId, TaxId }
export type DistrictId = 'capital' | 'industrial' | 'north' | 'rural'
export type NewsTone = 'neutral' | 'positive' | 'negative'
export type SectorId = 'industry' | 'services' | 'agriculture' | 'construction'
export type PoliticalBlocId = 'reform' | 'labor' | 'national' | 'oldGuard'
export type MinisterRole = 'finance' | 'economy' | 'interior' | 'foreign'

export type DistrictState = {
  id: DistrictId
  name: string
  population: number
  development: number
  condition: number
  activity: number
}

export type ProjectState = {
  id: string
  kind: ProjectId
  title: string
  progress: number
  durationDays: number
  startedDay: number
}

export type NewsItem = {
  id: string
  day: number
  title: string
  body: string
  tone: NewsTone
}

export type SectorState = {
  id: SectorId
  name: string
  firms: number
  jobs: number
  outputBillion: number
  productivity: number
  confidence: number
}

export type MoneyFlowSnapshot = {
  payroll: number
  householdConsumption: number
  taxRevenue: number
  publicSpending: number
  businessInvestment: number
  tradeBalance: number
  budgetBalance: number
}

export type EconomyState = {
  inflation: number
  averageWage: number
  householdCash: number
  businessCash: number
  taxRates: Record<TaxId, number>
  budgetPriorities: Record<BudgetArea, number>
  sectors: Record<SectorId, SectorState>
  monthAccumulator: MoneyFlowSnapshot
  last30Days: MoneyFlowSnapshot
}

export type PoliticalBlocState = {
  id: PoliticalBlocId
  name: string
  seats: number
  support: number
  influence: number
  loyalty: number
}

export type MinisterState = {
  role: MinisterRole
  name: string
  competence: number
  loyalty: number
  ambition: number
}

export type PoliticsState = {
  stability: number
  legitimacy: number
  corruption: number
  parliamentApproval: number
  policies: Record<PoliticalPolicyId, number>
  blocs: Record<PoliticalBlocId, PoliticalBlocState>
  ministers: Record<MinisterRole, MinisterState>
}

export type CountryState = {
  schemaVersion: 4
  day: number
  hour: number
  speed: GameSpeed
  treasury: number
  population: number
  gdp: number
  debt: number
  prosperity: number
  infrastructure: number
  employment: number
  ecology: number
  approval: number
  economy: EconomyState
  politics: PoliticsState
  districts: Record<DistrictId, DistrictState>
  projects: ProjectState[]
  news: NewsItem[]
  serial: number
}
