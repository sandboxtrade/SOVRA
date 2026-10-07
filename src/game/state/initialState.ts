import type {
  CountryState,
  DistrictId,
  DistrictState,
  MinisterRole,
  MinisterState,
  MoneyFlowSnapshot,
  PoliticalBlocId,
  PoliticalBlocState,
  SectorId,
  SectorState,
} from './types'

const district = (
  id: DistrictId,
  name: string,
  population: number,
  development: number,
  condition: number,
  activity: number,
): DistrictState => ({ id, name, population, development, condition, activity })

const sector = (
  id: SectorId,
  name: string,
  firms: number,
  jobs: number,
  outputBillion: number,
  productivity: number,
  confidence: number,
): SectorState => ({ id, name, firms, jobs, outputBillion, productivity, confidence })

const bloc = (
  id: PoliticalBlocId,
  name: string,
  seats: number,
  support: number,
  influence: number,
  loyalty: number,
): PoliticalBlocState => ({ id, name, seats, support, influence, loyalty })

const minister = (
  role: MinisterRole,
  name: string,
  competence: number,
  loyalty: number,
  ambition: number,
): MinisterState => ({ role, name, competence, loyalty, ambition })

export const EMPTY_FLOW: MoneyFlowSnapshot = {
  payroll: 0,
  householdConsumption: 0,
  taxRevenue: 0,
  publicSpending: 0,
  businessInvestment: 0,
  tradeBalance: 0,
  budgetBalance: 0,
}

export const INITIAL_COUNTRY: CountryState = {
  schemaVersion: 4,
  day: 1,
  hour: 6.5,
  speed: 1,
  treasury: 210,
  population: 1_184_000,
  gdp: 18.4,
  debt: 7.1,
  prosperity: 24,
  infrastructure: 31,
  employment: 68,
  ecology: 49,
  approval: 46,
  economy: {
    inflation: 8.7,
    averageWage: 54_000,
    householdCash: 132,
    businessCash: 96,
    taxRates: { income: 13, business: 18, sales: 12 },
    budgetPriorities: { infrastructure: 42, education: 45, health: 48, security: 40 },
    sectors: {
      industry: sector('industry', 'Промышленность', 680, 138_000, 5.1, 44, 43),
      services: sector('services', 'Услуги', 8_400, 284_000, 8.2, 48, 46),
      agriculture: sector('agriculture', 'Сельское хозяйство', 1_180, 48_000, 2.2, 39, 51),
      construction: sector('construction', 'Строительство', 910, 58_000, 2.9, 42, 38),
    },
    monthAccumulator: { ...EMPTY_FLOW },
    last30Days: { ...EMPTY_FLOW },
  },
  politics: {
    stability: 52,
    legitimacy: 56,
    corruption: 61,
    parliamentApproval: 48,
    policies: {
      mediaFreedom: 46,
      executivePower: 58,
      localAutonomy: 34,
      policePowers: 55,
      antiCorruption: 29,
    },
    blocs: {
      reform: bloc('reform', 'Реформаторы', 31, 27, 48, 47),
      labor: bloc('labor', 'Социальный блок', 28, 24, 43, 51),
      national: bloc('national', 'Национальный союз', 25, 22, 52, 44),
      oldGuard: bloc('oldGuard', 'Старая гвардия', 36, 27, 67, 55),
    },
    ministers: {
      finance: minister('finance', 'Алексей Морозов', 71, 58, 44),
      economy: minister('economy', 'Ирина Белова', 67, 62, 51),
      interior: minister('interior', 'Виктор Орлов', 63, 55, 66),
      foreign: minister('foreign', 'Мария Воронцова', 75, 64, 48),
    },
  },
  districts: {
    capital: district('capital', 'Североград', 515_000, 30, 34, 52),
    industrial: district('industrial', 'Промышленный пояс', 248_000, 24, 25, 61),
    north: district('north', 'Северные районы', 276_000, 19, 28, 35),
    rural: district('rural', 'Сельские земли', 145_000, 15, 37, 29),
  },
  projects: [],
  news: [
    {
      id: 'n-0',
      day: 1,
      title: 'Новое правительство приступило к работе',
      body: 'Страна входит в новый политический цикл на фоне слабой инфраструктуры, коррупции и стагнирующей экономики.',
      tone: 'neutral',
    },
  ],
  serial: 1,
}
