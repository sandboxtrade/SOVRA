import type { GameActionRequest } from '../../../shared/gameActions'

export type LocalInterpretation = {
  actions: GameActionRequest[]
  message: string
}

const RELATIVE_VERBS = /(сниз|уменьш|сократ|повыс|увелич|подним|ослаб|усил)/
const ABSOLUTE_VERBS = /(установ|постав|зафикс|сделай|назнач|выстав)/

function absoluteValueNear(text: string, variants: string[]) {
  for (const variant of variants) {
    const index = text.indexOf(variant)
    if (index < 0) continue

    const before = text.slice(Math.max(0, index - 34), index)
    const after = text.slice(index + variant.length, index + variant.length + 56)
    const match = after.match(/^[а-яa-z-]{0,14}\s*(?:(до|на|=|:)\s*)?(\d{1,3}(?:[.,]\d+)?)\s*%?/i)
    if (!match) continue

    const connector = match[1] ?? ''
    // "снизь ... на 5%" means a relative change, not an absolute value of 5.
    // Route it to GPT until relative actions exist in the game contract.
    if (connector === 'на' && RELATIVE_VERBS.test(before) && !ABSOLUTE_VERBS.test(before)) continue

    const value = Number(match[2].replace(',', '.'))
    if (Number.isFinite(value)) return value
  }
  return null
}

/**
 * Free shortcut for literal commands. It intentionally understands only obvious,
 * affirmative, absolute instructions. Ambiguous/relative/negative wording falls
 * through to GPT instead of risking a wrong game mutation.
 */
export function interpretLocally(input: string): LocalInterpretation | null {
  const text = input.toLowerCase().replace(/ё/g, 'е').trim()
  if (!text) return null

  // Negation and questions are semantic, not literal commands. Never guess locally.
  if (/(^|\s)не(?=\s|$)/.test(text) || text.includes('?')) return null

  const actions: GameActionRequest[] = []

  const taxRules: Array<[GameActionRequest & { type: 'SET_TAX_RATE' }, string[]]> = [
    [{ type: 'SET_TAX_RATE', tax: 'business', rate: 0 }, ['налог на прибыль', 'налог для бизнеса', 'налог бизнеса']],
    [{ type: 'SET_TAX_RATE', tax: 'income', rate: 0 }, ['подоходный налог', 'налог на доходы', 'ндфл']],
    [{ type: 'SET_TAX_RATE', tax: 'sales', rate: 0 }, ['налог с продаж', 'налог на продажи']],
  ]
  for (const [template, variants] of taxRules) {
    const value = absoluteValueNear(text, variants)
    if (value !== null) actions.push({ ...template, rate: value })
  }

  const budgetRules: Array<[GameActionRequest & { type: 'SET_BUDGET_PRIORITY' }, string[]]> = [
    [{ type: 'SET_BUDGET_PRIORITY', area: 'infrastructure', level: 0 }, ['инфраструктур']],
    [{ type: 'SET_BUDGET_PRIORITY', area: 'education', level: 0 }, ['образован']],
    [{ type: 'SET_BUDGET_PRIORITY', area: 'health', level: 0 }, ['здравоохран', 'медицин']],
    [{ type: 'SET_BUDGET_PRIORITY', area: 'security', level: 0 }, ['безопасност', 'силовик']],
  ]
  if (/приоритет|финансирован|бюджет/.test(text)) {
    for (const [template, variants] of budgetRules) {
      const value = absoluteValueNear(text, variants)
      if (value !== null) actions.push({ ...template, level: value })
    }
  }

  const politicalRules: Array<[GameActionRequest & { type: 'SET_POLITICAL_POLICY' }, string[]]> = [
    [{ type: 'SET_POLITICAL_POLICY', policy: 'mediaFreedom', level: 0 }, ['свобод СМИ', 'свободу СМИ']],
    [{ type: 'SET_POLITICAL_POLICY', policy: 'executivePower', level: 0 }, ['исполнительной власти', 'полномочия президента', 'полномочия власти']],
    [{ type: 'SET_POLITICAL_POLICY', policy: 'localAutonomy', level: 0 }, ['автономи регион', 'региональной автоном']],
    [{ type: 'SET_POLITICAL_POLICY', policy: 'policePowers', level: 0 }, ['полномочия полиции', 'полномочия силов', 'силовых структур']],
    [{ type: 'SET_POLITICAL_POLICY', policy: 'antiCorruption', level: 0 }, ['антикоррупц', 'борьбу с коррупц']],
  ]
  for (const [template, variants] of politicalRules) {
    const value = absoluteValueNear(text, variants)
    if (value !== null) actions.push({ ...template, level: value })
  }

  const projectMap: Array<[GameActionRequest & { type: 'START_PROJECT' }, RegExp]> = [
    [{ type: 'START_PROJECT', project: 'roads' }, /(ремонт|чинить|обновить|отремонтируй).{0,20}дорог/],
    [{ type: 'START_PROJECT', project: 'industry' }, /(поддерж|разв|запусти).{0,20}промышлен/],
    [{ type: 'START_PROJECT', project: 'districts' }, /(реновац|обнов|запусти).{0,20}(район|панел)/],
    [{ type: 'START_PROJECT', project: 'smallBusiness' }, /(льгот|поддерж|разв).{0,20}(мал.*бизнес|предприним)/],
    [{ type: 'START_PROJECT', project: 'transit' }, /(обнов|разв|запусти).{0,20}(транспорт|автобус)/],
    [{ type: 'START_PROJECT', project: 'cleanup' }, /(благоустр|уборк|озелен|очист)/],
  ]
  for (const [action, pattern] of projectMap) if (pattern.test(text)) actions.push(action)

  if (/(^|\s)пауза(?=\s|$)|останови время/.test(text)) actions.push({ type: 'SET_GAME_SPEED', speed: 0 })
  else if (/(^|\s)(ускорь|быстро|x4|×4)(?=\s|$)/.test(text)) actions.push({ type: 'SET_GAME_SPEED', speed: 4 })
  else if (/(^|\s)(обычная скорость|x1|×1)(?=\s|$)/.test(text)) actions.push({ type: 'SET_GAME_SPEED', speed: 1 })

  const unique = actions.filter((action, index, array) => {
    const key = JSON.stringify(action)
    return array.findIndex((candidate) => JSON.stringify(candidate) === key) === index
  }).slice(0, 8)

  if (!unique.length) return null
  return {
    actions: unique,
    message: 'Команда распознана локально — API не использован.',
  }
}
