import type { CountryState } from '../state/types'
import { updateDistricts } from './districts'
import { stepEconomy } from './economy'
import { maybeGenerateSystemNews } from './news'
import { stepPolitics } from './politics'
import { stepProjects } from './policies'

function dailyUpdate(state: CountryState): CountryState {
  let next = stepProjects(state)
  next = stepEconomy(next)
  next = stepPolitics(next)
  next = { ...next, districts: updateDistricts(next) }
  next = maybeGenerateSystemNews(next)
  return next
}

export function advanceTime(state: CountryState, deltaSeconds: number): CountryState {
  if (state.speed === 0 || deltaSeconds <= 0) return state

  const hoursPerRealSecond = 0.42 * state.speed
  let hour = state.hour + deltaSeconds * hoursPerRealSecond
  let day = state.day
  let next = state

  while (hour >= 24) {
    hour -= 24
    day += 1
    next = dailyUpdate({ ...next, day, hour })
  }

  return { ...next, day, hour }
}
