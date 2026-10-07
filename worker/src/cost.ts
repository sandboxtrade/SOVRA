import type { OpenAiUsage } from './types'

type Prices = { input: number; cachedInput: number; cacheWrite: number; output: number }

// Standard short-context rates per 1M tokens. Requests in SOVRA are intentionally tiny.
// Unknown models use the conservative Astra rate so the local budget meter cannot silently undercount.
const PRICES: Record<string, Prices> = {
  'gpt-6-luna': { input: 0.10, cachedInput: 0.01, cacheWrite: 0.125, output: 0.50 },
  'gpt-5.6-luna': { input: 0.20, cachedInput: 0.02, cacheWrite: 0.25, output: 1.20 },
  'gpt-6-sol': { input: 2.00, cachedInput: 0.20, cacheWrite: 2.50, output: 10.00 },
  'gpt-6.1-sol': { input: 2.00, cachedInput: 0.10, cacheWrite: 2.50, output: 10.00 },
  'gpt-6-astra': { input: 10.00, cachedInput: 1.00, cacheWrite: 12.50, output: 50.00 },
}

const FALLBACK_PRICES = PRICES['gpt-6-astra']

function tierMultiplier(serviceTier: string | undefined) {
  if (serviceTier === 'flex') return 0.5
  if (serviceTier === 'fast' || serviceTier === 'priority') return 2
  return 1
}

export function normalizeUsage(usage: OpenAiUsage | undefined, serviceTier: string | undefined, model: string | undefined) {
  const inputTokens = usage?.input_tokens ?? 0
  const cachedInputTokens = usage?.input_tokens_details?.cached_tokens ?? 0
  const cacheWriteTokens = usage?.input_tokens_details?.cache_write_tokens ?? 0
  const outputTokens = usage?.output_tokens ?? 0
  const ordinaryInput = Math.max(0, inputTokens - cachedInputTokens - cacheWriteTokens)
  const prices = (model && PRICES[model]) || FALLBACK_PRICES
  const multiplier = tierMultiplier(serviceTier)
  const estimatedUsd = multiplier * (
    ordinaryInput * prices.input / 1_000_000 +
    cachedInputTokens * prices.cachedInput / 1_000_000 +
    cacheWriteTokens * prices.cacheWrite / 1_000_000 +
    outputTokens * prices.output / 1_000_000
  )

  return {
    inputTokens,
    cachedInputTokens,
    cacheWriteTokens,
    outputTokens,
    estimatedUsd: Number(estimatedUsd.toFixed(8)),
  }
}
