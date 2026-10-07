import { EMPTY_FLOW } from '../state/initialState'
import type { CountryState, MoneyFlowSnapshot, SectorState } from '../state/types'
import { addFlow, clamp, round } from './math'

const WORKING_AGE_SHARE = 0.57

function updateSector(
  sector: SectorState,
  demand: number,
  taxPressure: number,
  infrastructure: number,
  cashPressure: number,
  allowFirmChange: boolean,
): SectorState {
  const confidenceDrift = (demand - 1) * 0.18 + (infrastructure - 35) * 0.002 - (taxPressure - 24) * 0.004 + cashPressure
  const confidence = clamp(sector.confidence + confidenceDrift, 5, 95)
  const productivity = clamp(sector.productivity + (infrastructure - 35) * 0.0008 + (confidence - 45) * 0.0005, 20, 90)
  const firmChange = allowFirmChange ? (confidence > 62 ? 1 : confidence < 22 && sector.firms > 50 ? -1 : 0) : 0
  return { ...sector, confidence, productivity, firms: Math.max(1, sector.firms + firmChange) }
}

export function stepEconomy(state: CountryState): CountryState {
  const economy = state.economy
  const employedPeople = state.population * WORKING_AGE_SHARE * (state.employment / 100)
  const payroll = employedPeople * economy.averageWage / 30 / 1_000_000_000
  const incomeTax = payroll * economy.taxRates.income / 100
  const disposablePayroll = payroll - incomeTax

  const inflationDrag = Math.max(0.55, 1 - Math.max(0, economy.inflation - 5) * 0.012)
  const confidence = Object.values(economy.sectors).reduce((sum, sector) => sum + sector.confidence, 0) / 4
  const consumptionPropensity = clamp(0.69 + (state.prosperity - 40) * 0.0018 + (confidence - 45) * 0.001, 0.5, 0.84)
  const householdConsumption = disposablePayroll * consumptionPropensity * inflationDrag
  const salesTax = householdConsumption * economy.taxRates.sales / (100 + economy.taxRates.sales)

  const domesticDemand = householdConsumption - salesTax
  const annualGdpDaily = state.gdp / 365
  const tradeBalance = round(payroll * (0.018 + (economy.sectors.industry.productivity - 45) * 0.0007), 4)
  const businessRevenue = payroll * (1.16 + (confidence - 45) * 0.0015) + domesticDemand * 0.22 + Math.max(0, tradeBalance)
  const operatingCost = payroll + businessRevenue * 0.085 + Math.max(0, -tradeBalance)
  const preTaxProfit = Math.max(0, businessRevenue - operatingCost)
  const businessTax = preTaxProfit * economy.taxRates.business / 100
  const afterTaxProfit = preTaxProfit - businessTax
  const businessInvestment = Math.max(0, afterTaxProfit * (0.22 + confidence / 330))

  const priorityTotal = Object.values(economy.budgetPriorities).reduce((sum, value) => sum + value, 0)
  const publicSpending = 0.06 + state.population / 20_000_000 + priorityTotal * 0.00045
  const taxRevenue = incomeTax + salesTax + businessTax
  const budgetBalance = taxRevenue - publicSpending

  const flow: MoneyFlowSnapshot = {
    payroll: round(payroll, 4),
    householdConsumption: round(householdConsumption, 4),
    taxRevenue: round(taxRevenue, 4),
    publicSpending: round(publicSpending, 4),
    businessInvestment: round(businessInvestment, 4),
    tradeBalance: round(tradeBalance, 4),
    budgetBalance: round(budgetBalance, 4),
  }

  const demandIndex = clamp(householdConsumption / Math.max(0.1, payroll * 0.62), 0.65, 1.35)
  const taxPressure = economy.taxRates.business + economy.taxRates.sales * 0.45
  const cashPressure = economy.businessCash < 35 ? -0.04 : economy.businessCash > 120 ? 0.01 : 0
  const allowFirmChange = state.day % 7 === 0
  const sectors = {
    industry: updateSector(economy.sectors.industry, demandIndex * 0.94, taxPressure, state.infrastructure, cashPressure, allowFirmChange),
    services: updateSector(economy.sectors.services, demandIndex * 1.06, taxPressure, state.infrastructure, cashPressure, allowFirmChange),
    agriculture: updateSector(economy.sectors.agriculture, 0.98 + state.ecology / 500, taxPressure * 0.7, state.infrastructure, cashPressure, allowFirmChange),
    construction: updateSector(economy.sectors.construction, 0.9 + state.projects.length * 0.08 + state.prosperity / 450, taxPressure, state.infrastructure, cashPressure, allowFirmChange),
  }

  const averageConfidence = Object.values(sectors).reduce((sum, sector) => sum + sector.confidence, 0) / 4
  const employmentTarget = clamp(61 + averageConfidence * 0.22 + state.infrastructure * 0.08 - economy.inflation * 0.18, 48, 91)
  const employment = clamp(state.employment + (employmentTarget - state.employment) * 0.012)

  const demandInflation = (demandIndex - 1) * 0.12
  const fiscalInflation = Math.max(0, -budgetBalance) * 0.055
  const supplyRelief = (state.infrastructure - 35) * 0.0018
  const inflation = clamp(economy.inflation + demandInflation + fiscalInflation - supplyRelief - (economy.inflation - 6) * 0.006, 0.5, 40)

  const wageGrowth = (inflation / 36500) + (employment - 68) * 0.000003
  const averageWage = Math.max(22_000, economy.averageWage * (1 + wageGrowth))
  const businessCash = Math.max(5, economy.businessCash + afterTaxProfit - businessInvestment - Math.max(0, -tradeBalance))
  const householdCash = Math.max(10, economy.householdCash + disposablePayroll - householdConsumption)

  const annualGrowth = (employment - 66) * 0.008 + (averageConfidence - 45) * 0.006 + (state.infrastructure - 35) * 0.004
  const gdp = Math.max(8, state.gdp * (1 + annualGrowth / 365))
  const prosperity = clamp(state.prosperity + (employment - 66) * 0.0024 - Math.max(0, inflation - 8) * 0.0015 + (state.infrastructure - 32) * 0.001)

  const monthAccumulator = addFlow(economy.monthAccumulator, flow)
  const monthBoundary = state.day % 30 === 0

  return {
    ...state,
    treasury: round(Math.max(-80, state.treasury + budgetBalance), 3),
    gdp: round(gdp, 3),
    employment,
    prosperity,
    approval: clamp(state.approval + (prosperity - 30) * 0.0012 - Math.max(0, inflation - 10) * 0.003),
    economy: {
      ...economy,
      inflation: round(inflation, 2),
      averageWage: round(averageWage, 0),
      householdCash: round(householdCash, 3),
      businessCash: round(businessCash, 3),
      sectors,
      monthAccumulator: monthBoundary ? { ...EMPTY_FLOW } : monthAccumulator,
      last30Days: monthBoundary ? monthAccumulator : economy.last30Days,
    },
  }
}
