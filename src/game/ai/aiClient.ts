import type { AiToolCall } from '../../../shared/gameActions'
import type { CountryState } from '../state/types'
import type { AiUsage } from './aiUsage'
import { buildAiSnapshot } from './compactState'

export type AiCommandResponse = {
  message: string
  toolCalls: AiToolCall[]
  model?: string
  usage?: AiUsage
}

export const AI_API_URL = (import.meta.env.VITE_AI_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function isAiConfigured() {
  return AI_API_URL.length > 0
}

function normalizeResponse(value: unknown): AiCommandResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('AI endpoint returned an invalid response')
  const record = value as Record<string, unknown>
  const toolCalls = Array.isArray(record.toolCalls) ? record.toolCalls.filter((item): item is AiToolCall => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    const call = item as Record<string, unknown>
    return typeof call.name === 'string' && call.arguments !== null && typeof call.arguments === 'object' && !Array.isArray(call.arguments)
  }) : []

  return {
    message: typeof record.message === 'string' ? record.message : '',
    toolCalls,
    model: typeof record.model === 'string' ? record.model : undefined,
    usage: record.usage && typeof record.usage === 'object' && !Array.isArray(record.usage)
      ? record.usage as AiUsage
      : undefined,
  }
}

export async function sendAiCommand(message: string, state: CountryState): Promise<AiCommandResponse> {
  if (!isAiConfigured()) throw new Error('AI endpoint is not configured')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60_000)
  try {
    const response = await fetch(`${AI_API_URL}/ai/command`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: message.slice(0, 700), state: buildAiSnapshot(state) }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(body || `AI request failed: ${response.status}`)
    }

    return normalizeResponse(await response.json())
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('ИИ не ответил за 60 секунд. Запрос остановлен.')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
