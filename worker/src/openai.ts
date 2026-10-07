import { AI_EXECUTE_TOOL } from '../../shared/gameActions'
import { normalizeUsage } from './cost'
import { COMMAND_INSTRUCTIONS } from './prompts'
import type { Env, OpenAiUsage } from './types'

type ToolOutput = Record<string, unknown>

function safeParseArguments(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

async function requestOpenAi(env: Env, message: string, state: object, serviceTier: string) {
  const model = env.OPENAI_MODEL || 'gpt-6-luna'
  return fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      service_tier: serviceTier,
      store: false,
      reasoning: { effort: 'none' },
      text: { verbosity: 'low' },
      instructions: COMMAND_INSTRUCTIONS,
      input: [{ role: 'user', content: `S=${JSON.stringify(state)}\nP=${message}` }],
      tools: [AI_EXECUTE_TOOL],
      tool_choice: 'auto',
      parallel_tool_calls: true,
      // A little headroom prevents a multi-action tool response from being truncated.
      max_output_tokens: 220,
      // No breakpoint is supplied on purpose: changing game state is not worth a cache-write charge.
      prompt_cache_options: { mode: 'explicit' },
    }),
  })
}

export async function runCommand(env: Env, message: string, state: object) {
  const preferredTier = env.OPENAI_SERVICE_TIER || 'flex'
  let response = await requestOpenAi(env, message, state, preferredTier)
  let usedTier = preferredTier

  // Cost-first default: do not silently double token pricing when Flex is busy.
  // Standard fallback is opt-in for users who prefer availability over minimum spend.
  if (
    !response.ok &&
    preferredTier === 'flex' &&
    env.OPENAI_ALLOW_STANDARD_FALLBACK === 'true' &&
    [408, 429, 500, 502, 503, 504].includes(response.status)
  ) {
    response = await requestOpenAi(env, message, state, 'default')
    usedTier = 'default'
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText.slice(0, 700) || `OpenAI ${response.status}`)
  }

  const result = await response.json() as Record<string, unknown>
  const output = Array.isArray(result.output) ? result.output as ToolOutput[] : []
  const toolCalls = output
    .filter((item) => item.type === 'function_call' && item.name === 'execute_game_action')
    .slice(0, 8)
    .map((item) => ({
      id: String(item.call_id || item.id || ''),
      name: 'execute_game_action',
      arguments: safeParseArguments(item.arguments),
    }))

  const textParts: string[] = []
  for (const item of output) {
    if (item.type !== 'message' || !Array.isArray(item.content)) continue
    for (const part of item.content as ToolOutput[]) {
      if (part.type === 'output_text' && typeof part.text === 'string') textParts.push(part.text)
    }
  }

  const serviceTier = typeof result.service_tier === 'string' ? result.service_tier : usedTier
  const model = typeof result.model === 'string' ? result.model : (env.OPENAI_MODEL || 'gpt-6-luna')
  return {
    message: textParts.join('\n').trim() || (toolCalls.length ? 'Команда передана в государственную систему.' : 'Не удалось определить исполнимое действие.'),
    toolCalls,
    model,
    serviceTier,
    usage: normalizeUsage(result.usage as OpenAiUsage | undefined, serviceTier, model),
  }
}
