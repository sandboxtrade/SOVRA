import {
  BUDGET_AREAS,
  GAME_SPEEDS,
  POLITICAL_POLICY_IDS,
  PROJECT_IDS,
  TAX_IDS,
} from '../../../shared/gameActions'
import type { AiToolCall, GameActionRequest } from '../../../shared/gameActions'
import type { CountryState } from '../state/types'
import { round } from '../simulation/math'
import { pushNews } from '../simulation/news'
import { startProject } from '../simulation/policies'

const taxNames = { income: 'подоходного налога', business: 'налога на прибыль', sales: 'налога с продаж' } as const
const budgetNames = { infrastructure: 'инфраструктуры', education: 'образования', health: 'здравоохранения', security: 'безопасности' } as const
const politicsNames = {
  mediaFreedom: 'свободы СМИ',
  executivePower: 'полномочий исполнительной власти',
  localAutonomy: 'региональной автономии',
  policePowers: 'полномочий силовых структур',
  antiCorruption: 'антикоррупционной политики',
} as const

export type ActionResult = {
  state: CountryState
  applied: boolean
  message: string
}

export function dispatchGameAction(state: CountryState, action: GameActionRequest): ActionResult {
  switch (action.type) {
    case 'START_PROJECT': {
      const next = startProject(state, action.project)
      const applied = next !== state
      return { state: next, applied, message: applied ? 'Проект запущен.' : 'Проект нельзя запустить сейчас.' }
    }
    case 'SET_TAX_RATE': {
      const rate = round(Math.max(0, Math.min(60, action.rate)), 1)
      if (state.economy.taxRates[action.tax] === rate) return { state, applied: false, message: 'Ставка уже установлена.' }
      let next: CountryState = {
        ...state,
        economy: { ...state.economy, taxRates: { ...state.economy.taxRates, [action.tax]: rate } },
      }
      next = pushNews(next, {
        title: `Изменена ставка ${taxNames[action.tax]}`,
        body: `Новая ставка — ${rate}%. Реакция экономики будет проявляться постепенно через денежные потоки, занятость и цены.`,
        tone: 'neutral',
      })
      return { state: next, applied: true, message: `Ставка изменена на ${rate}%.` }
    }
    case 'SET_BUDGET_PRIORITY': {
      const level = round(Math.max(0, Math.min(100, action.level)), 0)
      if (state.economy.budgetPriorities[action.area] === level) return { state, applied: false, message: 'Приоритет уже установлен.' }
      let next: CountryState = {
        ...state,
        economy: { ...state.economy, budgetPriorities: { ...state.economy.budgetPriorities, [action.area]: level } },
      }
      next = pushNews(next, {
        title: `Пересмотрено финансирование ${budgetNames[action.area]}`,
        body: `Приоритет направления установлен на ${level}/100. Это влияет на ежедневные расходы бюджета и долгосрочное состояние страны.`,
        tone: 'neutral',
      })
      return { state: next, applied: true, message: `Приоритет установлен на ${level}/100.` }
    }
    case 'SET_POLITICAL_POLICY': {
      const level = round(Math.max(0, Math.min(100, action.level)), 0)
      if (state.politics.policies[action.policy] === level) return { state, applied: false, message: 'Политический курс уже соответствует этому уровню.' }
      let next: CountryState = {
        ...state,
        politics: {
          ...state.politics,
          policies: { ...state.politics.policies, [action.policy]: level },
        },
      }
      next = pushNews(next, {
        title: `Изменён курс ${politicsNames[action.policy]}`,
        body: `Новый уровень — ${level}/100. Парламентские группы, министры и общество будут реагировать на решение постепенно.`,
        tone: 'neutral',
      })
      return { state: next, applied: true, message: `Политический курс установлен на ${level}/100.` }
    }
    case 'SET_GAME_SPEED':
      return { state: { ...state, speed: action.speed }, applied: state.speed !== action.speed, message: 'Скорость времени изменена.' }
  }
}

export function dispatchGameActions(state: CountryState, actions: GameActionRequest[]): ActionResult {
  let next = state
  const messages: string[] = []
  let applied = false
  for (const action of actions.slice(0, 8)) {
    const result = dispatchGameAction(next, action)
    next = result.state
    if (result.applied) applied = true
    messages.push(result.message)
  }
  return { state: next, applied, message: messages.join(' ') }
}

function toFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function toolCallToAction(call: AiToolCall): GameActionRequest | null {
  if (call.name !== 'execute_game_action') return null
  const action = call.arguments.action
  const target = call.arguments.target
  const value = toFiniteNumber(call.arguments.value)
  if (typeof action !== 'string' || typeof target !== 'string') return null

  switch (action) {
    case 'project':
      if (!PROJECT_IDS.includes(target as (typeof PROJECT_IDS)[number])) return null
      return { type: 'START_PROJECT', project: target as (typeof PROJECT_IDS)[number] }
    case 'tax':
      if (!TAX_IDS.includes(target as (typeof TAX_IDS)[number]) || value === null) return null
      return { type: 'SET_TAX_RATE', tax: target as (typeof TAX_IDS)[number], rate: value }
    case 'budget':
      if (!BUDGET_AREAS.includes(target as (typeof BUDGET_AREAS)[number]) || value === null) return null
      return { type: 'SET_BUDGET_PRIORITY', area: target as (typeof BUDGET_AREAS)[number], level: value }
    case 'politics':
      if (!POLITICAL_POLICY_IDS.includes(target as (typeof POLITICAL_POLICY_IDS)[number]) || value === null) return null
      return { type: 'SET_POLITICAL_POLICY', policy: target as (typeof POLITICAL_POLICY_IDS)[number], level: value }
    case 'speed':
      if (target !== 'simulation' || value === null || !GAME_SPEEDS.includes(value as (typeof GAME_SPEEDS)[number])) return null
      return { type: 'SET_GAME_SPEED', speed: value as (typeof GAME_SPEEDS)[number] }
    default:
      return null
  }
}
