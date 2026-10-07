import { runCommand } from './openai'
import type { Env, RequestBody } from './types'

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

function requestOrigin(request: Request) {
  return request.headers.get('origin') ?? ''
}

function originAllowed(request: Request, env: Env) {
  if (!env.ALLOWED_ORIGIN) return true
  return requestOrigin(request) === env.ALLOWED_ORIGIN
}

function corsHeaders(request: Request, env: Env) {
  const origin = requestOrigin(request)
  const allowOrigin = env.ALLOWED_ORIGIN || origin || '*'
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin',
  }
}

function json(data: unknown, status: number, request: Request, env: Env) {
  return new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...corsHeaders(request, env) } })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      if (!originAllowed(request, env)) return new Response(null, { status: 403, headers: corsHeaders(request, env) })
      return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    }

    if (url.pathname === '/health') {
      return json({
        ok: true,
        service: 'sovra-ai',
        model: env.OPENAI_MODEL || 'gpt-6-luna',
        tier: env.OPENAI_SERVICE_TIER || 'flex',
        originLocked: Boolean(env.ALLOWED_ORIGIN),
      }, 200, request, env)
    }

    if (url.pathname !== '/ai/command' || request.method !== 'POST') return json({ error: 'Not found' }, 404, request, env)
    if (!originAllowed(request, env)) return json({ error: 'Origin not allowed' }, 403, request, env)
    if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured' }, 503, request, env)

    let body: RequestBody
    try {
      body = await request.json() as RequestBody
    } catch {
      return json({ error: 'Invalid JSON' }, 400, request, env)
    }

    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 700) : ''
    if (!message) return json({ error: 'Message is required' }, 400, request, env)
    const state = body.state && typeof body.state === 'object' && !Array.isArray(body.state) ? body.state as object : {}

    try {
      return json(await runCommand(env, message, state), 200, request, env)
    } catch (error) {
      return json({ error: 'OpenAI request failed', detail: error instanceof Error ? error.message : String(error) }, 502, request, env)
    }
  },
}
