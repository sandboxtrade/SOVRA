import type { CountryState } from '../state/types'
import { clamp } from './math'

export function updateDistricts(state: CountryState): CountryState['districts'] {
  const { prosperity, infrastructure, employment, ecology } = state
  return {
    capital: {
      ...state.districts.capital,
      development: clamp(state.districts.capital.development + (prosperity - 35) * 0.0025),
      condition: clamp(state.districts.capital.condition + (infrastructure - 35) * 0.0022),
      activity: clamp(0.48 * employment + 0.52 * prosperity),
    },
    industrial: {
      ...state.districts.industrial,
      development: clamp(state.districts.industrial.development + (employment - 62) * 0.002),
      condition: clamp(state.districts.industrial.condition + (infrastructure - 40) * 0.0016),
      activity: clamp(0.72 * employment + 0.28 * (100 - ecology)),
    },
    north: {
      ...state.districts.north,
      development: clamp(state.districts.north.development + (prosperity - 38) * 0.0018),
      condition: clamp(state.districts.north.condition + (infrastructure - 42) * 0.0018),
      activity: clamp(0.55 * employment + 0.45 * prosperity - 8),
    },
    rural: {
      ...state.districts.rural,
      development: clamp(state.districts.rural.development + (infrastructure - 45) * 0.0012),
      condition: clamp(state.districts.rural.condition + (ecology - 45) * 0.0015),
      activity: clamp(0.4 * employment + 0.25 * prosperity + 0.35 * ecology - 10),
    },
  }
}
