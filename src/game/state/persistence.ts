import { INITIAL_COUNTRY } from './initialState'
import type { CountryState } from './types'

const SAVE_KEY = 'sovra-game'
const PREVIOUS_KEYS = ['sovra-game-v0.4.1', 'sovra-game-v0.4.0', 'sovra-game-v0.3.0', 'sovra-game-v0.2.0', 'state-game-v0.1.0']

export function loadGame(): CountryState {
  try {
    const current = localStorage.getItem(SAVE_KEY)
    if (current) return hydrate(JSON.parse(current))

    for (const key of PREVIOUS_KEYS) {
      const value = localStorage.getItem(key)
      if (value) return migrate(JSON.parse(value))
    }
  } catch {
    // Corrupt/unavailable storage must never prevent startup.
  }
  return structuredClone(INITIAL_COUNTRY)
}

export function saveGame(state: CountryState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // Safari/private storage/quota failures should not crash the running game.
  }
}

function mergeRecord<T extends Record<string, object>>(base: T, incoming: Partial<T> | undefined): T {
  const result = { ...base } as T
  for (const key of Object.keys(base) as Array<keyof T>) {
    const candidate = incoming?.[key]
    result[key] = candidate && typeof candidate === 'object'
      ? { ...base[key], ...candidate }
      : base[key]
  }
  return result
}

function mergeState(input: Partial<CountryState>): CountryState {
  const base = structuredClone(INITIAL_COUNTRY)
  return {
    ...base,
    ...input,
    schemaVersion: 4,
    economy: {
      ...base.economy,
      ...(input.economy ?? {}),
      taxRates: { ...base.economy.taxRates, ...(input.economy?.taxRates ?? {}) },
      budgetPriorities: { ...base.economy.budgetPriorities, ...(input.economy?.budgetPriorities ?? {}) },
      sectors: mergeRecord(base.economy.sectors, input.economy?.sectors),
      monthAccumulator: { ...base.economy.monthAccumulator, ...(input.economy?.monthAccumulator ?? {}) },
      last30Days: { ...base.economy.last30Days, ...(input.economy?.last30Days ?? {}) },
    },
    politics: {
      ...base.politics,
      ...(input.politics ?? {}),
      policies: { ...base.politics.policies, ...(input.politics?.policies ?? {}) },
      blocs: mergeRecord(base.politics.blocs, input.politics?.blocs),
      ministers: mergeRecord(base.politics.ministers, input.politics?.ministers),
    },
    districts: mergeRecord(base.districts, input.districts),
    projects: Array.isArray(input.projects) ? input.projects : [],
    news: Array.isArray(input.news) ? input.news : base.news,
    speed: 1,
  }
}

function hydrate(input: Partial<CountryState>) {
  return mergeState(input)
}

export function migrate(input: Partial<CountryState> & Record<string, unknown>): CountryState {
  const base = structuredClone(INITIAL_COUNTRY)
  const numberOr = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
  const merged = mergeState(input)
  return {
    ...merged,
    day: numberOr(input.day, base.day),
    hour: numberOr(input.hour, base.hour),
    treasury: numberOr(input.treasury, base.treasury),
    population: numberOr(input.population, base.population),
    gdp: numberOr(input.gdp, base.gdp),
    debt: numberOr(input.debt, base.debt),
    prosperity: numberOr(input.prosperity, base.prosperity),
    infrastructure: numberOr(input.infrastructure, base.infrastructure),
    employment: numberOr(input.employment, base.employment),
    ecology: numberOr(input.ecology, base.ecology),
    approval: numberOr(input.approval, base.approval),
    schemaVersion: 4,
    speed: 1,
  }
}
