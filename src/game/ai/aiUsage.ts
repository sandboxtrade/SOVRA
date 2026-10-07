export type AiUsage = {
  inputTokens: number
  cachedInputTokens: number
  cacheWriteTokens: number
  outputTokens: number
  estimatedUsd: number
}

export type AiUsageSummary = AiUsage & {
  paidRequests: number
  localCommands: number
}

const KEY = 'sovra-ai-usage-v1'
const EMPTY: AiUsageSummary = {
  inputTokens: 0,
  cachedInputTokens: 0,
  cacheWriteTokens: 0,
  outputTokens: 0,
  estimatedUsd: 0,
  paidRequests: 0,
  localCommands: 0,
}

export const configuredAiBudgetUsd = (() => {
  const value = Number(import.meta.env.VITE_AI_BUDGET_USD ?? 3)
  return Number.isFinite(value) && value > 0 ? value : 3
})()

export function getAiUsageSummary(): AiUsageSummary {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<AiUsageSummary> | null
    return parsed ? { ...EMPTY, ...parsed } : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

function save(summary: AiUsageSummary) {
  try {
    localStorage.setItem(KEY, JSON.stringify(summary))
  } catch {
    // Usage persistence is helpful but must never break a command if storage is unavailable.
  }
  return summary
}

export function recordPaidUsage(usage?: AiUsage) {
  const current = getAiUsageSummary()
  if (!usage) return save({ ...current, paidRequests: current.paidRequests + 1 })
  return save({
    inputTokens: current.inputTokens + usage.inputTokens,
    cachedInputTokens: current.cachedInputTokens + usage.cachedInputTokens,
    cacheWriteTokens: current.cacheWriteTokens + usage.cacheWriteTokens,
    outputTokens: current.outputTokens + usage.outputTokens,
    estimatedUsd: current.estimatedUsd + usage.estimatedUsd,
    paidRequests: current.paidRequests + 1,
    localCommands: current.localCommands,
  })
}

export function recordLocalCommand() {
  const current = getAiUsageSummary()
  return save({ ...current, localCommands: current.localCommands + 1 })
}
