import type { DistrictState } from '../game/state/types'

export function conditionText(value: number, low: string, mid: string, high: string) {
  if (value < 35) return low
  if (value < 62) return mid
  return high
}

export function districtDescription(district: DistrictState) {
  const condition = conditionText(district.condition, 'изношенный', 'стабильный', 'ухоженный')
  const activity = conditionText(district.activity, 'тихий', 'живой', 'перегретый')
  return `${condition} · ${activity}`
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function money(value: number, digits = 1) {
  return `${value.toFixed(digits)} млрд`
}
