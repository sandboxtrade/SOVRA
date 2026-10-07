import type { MoneyFlowSnapshot } from '../state/types'

export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
export const clamp01 = (value: number) => clamp(value, 0, 1)
export const round = (value: number, digits = 2) => Number(value.toFixed(digits))

export function addFlow(a: MoneyFlowSnapshot, b: MoneyFlowSnapshot): MoneyFlowSnapshot {
  return {
    payroll: a.payroll + b.payroll,
    householdConsumption: a.householdConsumption + b.householdConsumption,
    taxRevenue: a.taxRevenue + b.taxRevenue,
    publicSpending: a.publicSpending + b.publicSpending,
    businessInvestment: a.businessInvestment + b.businessInvestment,
    tradeBalance: a.tradeBalance + b.tradeBalance,
    budgetBalance: a.budgetBalance + b.budgetBalance,
  }
}
