import type { CountryState, PoliticalBlocState } from '../state/types'
import { clamp, round } from './math'

export const POLITICAL_POLICY_INFO = {
  mediaFreedom: { title: 'Свобода СМИ', low: 'жёсткий контроль', high: 'свободная пресса' },
  executivePower: { title: 'Исполнительная власть', low: 'слабый центр', high: 'сильный центр' },
  localAutonomy: { title: 'Автономия регионов', low: 'централизация', high: 'широкая автономия' },
  policePowers: { title: 'Полномочия силовиков', low: 'ограниченные', high: 'расширенные' },
  antiCorruption: { title: 'Борьба с коррупцией', low: 'формальная', high: 'жёсткая' },
} as const

function drift(value: number, target: number, speed: number) {
  return clamp(value + (target - value) * speed)
}

function updateBloc(state: CountryState, bloc: PoliticalBlocState): PoliticalBlocState {
  const p = state.politics.policies
  const economyScore = clamp(
    45 + (state.employment - 68) * 1.2 + (state.prosperity - 30) * 0.7 - Math.max(0, state.economy.inflation - 7) * 1.1,
  )

  let alignment = 50
  switch (bloc.id) {
    case 'reform':
      alignment = 34 + p.mediaFreedom * 0.34 + p.localAutonomy * 0.2 + (100 - p.executivePower) * 0.16 + p.antiCorruption * 0.16
      break
    case 'labor':
      alignment = 28 + state.economy.budgetPriorities.education * 0.2 + state.economy.budgetPriorities.health * 0.24 + (100 - state.economy.taxRates.income) * 0.08 + economyScore * 0.18
      break
    case 'national':
      alignment = 26 + p.policePowers * 0.28 + p.executivePower * 0.2 + state.economy.budgetPriorities.security * 0.2 + state.politics.stability * 0.14
      break
    case 'oldGuard':
      alignment = 30 + p.executivePower * 0.3 + (100 - p.mediaFreedom) * 0.18 + p.policePowers * 0.12 + state.politics.stability * 0.14
      break
  }

  const loyaltyTarget = clamp(alignment * 0.68 + economyScore * 0.32)
  const loyalty = drift(bloc.loyalty, loyaltyTarget, 0.018)
  const supportTarget = clamp(bloc.support * 0.8 + loyalty * 0.12 + economyScore * 0.08)
  const support = drift(bloc.support, supportTarget, 0.008)

  return { ...bloc, loyalty: round(loyalty, 2), support: round(support, 2) }
}

export function stepPolitics(state: CountryState): CountryState {
  const p = state.politics.policies
  const economicStress = Math.max(0, state.economy.inflation - 8) * 0.9 + Math.max(0, 68 - state.employment) * 0.7
  const orderEffect = (p.policePowers - 50) * 0.16 + (p.executivePower - 50) * 0.1
  const legitimacyPressure = (p.mediaFreedom - 50) * 0.1 + (p.localAutonomy - 40) * 0.06 - Math.max(0, p.executivePower - 65) * 0.12 - Math.max(0, p.policePowers - 70) * 0.08

  const corruptionTarget = clamp(
    68 - p.antiCorruption * 0.52 - p.mediaFreedom * 0.14 + p.executivePower * 0.12 + Math.max(0, 45 - state.prosperity) * 0.14,
    8,
    92,
  )
  const corruption = drift(state.politics.corruption, corruptionTarget, 0.012)

  const stabilityTarget = clamp(
    50 + orderEffect + state.approval * 0.22 + state.politics.legitimacy * 0.18 - economicStress - corruption * 0.12,
    8,
    94,
  )
  const stability = drift(state.politics.stability, stabilityTarget, 0.014)

  const legitimacyTarget = clamp(
    38 + state.approval * 0.3 + legitimacyPressure + p.antiCorruption * 0.1 - corruption * 0.12,
    8,
    95,
  )
  const legitimacy = drift(state.politics.legitimacy, legitimacyTarget, 0.01)

  const interim: CountryState = {
    ...state,
    politics: {
      ...state.politics,
      corruption: round(corruption, 2),
      stability: round(stability, 2),
      legitimacy: round(legitimacy, 2),
    },
  }

  const blocs = {
    reform: updateBloc(interim, interim.politics.blocs.reform),
    labor: updateBloc(interim, interim.politics.blocs.labor),
    national: updateBloc(interim, interim.politics.blocs.national),
    oldGuard: updateBloc(interim, interim.politics.blocs.oldGuard),
  }

  const totalSeats = Object.values(blocs).reduce((sum, bloc) => sum + bloc.seats, 0)
  const parliamentApproval = Object.values(blocs).reduce((sum, bloc) => sum + bloc.loyalty * bloc.seats, 0) / Math.max(1, totalSeats)

  const approvalTarget = clamp(
    34 + state.prosperity * 0.32 + state.employment * 0.2 - state.economy.inflation * 0.55 + legitimacy * 0.2 - corruption * 0.12,
  )
  const approval = drift(state.approval, approvalTarget, 0.008)

  const ministers = Object.fromEntries(Object.entries(state.politics.ministers).map(([role, minister]) => {
    const pressure = minister.ambition > 65 && stability < 40 ? -0.06 : 0
    const competenceRelief = (minister.competence - 60) * 0.0006
    const loyaltyTarget = clamp(42 + approval * 0.34 + stability * 0.18 - minister.ambition * 0.12)
    return [role, { ...minister, loyalty: round(drift(minister.loyalty, loyaltyTarget, 0.006) + pressure + competenceRelief, 2) }]
  })) as CountryState['politics']['ministers']

  return {
    ...interim,
    approval: round(approval, 2),
    politics: {
      ...interim.politics,
      parliamentApproval: round(parliamentApproval, 2),
      blocs,
      ministers,
    },
  }
}
