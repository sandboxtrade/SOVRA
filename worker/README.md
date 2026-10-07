# SOVRA AI Worker

The browser never receives the OpenAI API key. GitHub Pages calls this Worker; the Worker calls the OpenAI Responses API.

## Cheap defaults

- model: `gpt-6-luna`
- service tier: `flex`
- reasoning: `none`
- text verbosity: low
- max output: 220 tokens
- compact game snapshot
- one generic function tool
- no conversation history sent on command calls
- no automatic requests from the simulation

Flex is cheaper but can be slower or temporarily unavailable. To protect a tiny balance, v0.5.0 does **not** retry Standard by default. Set `OPENAI_ALLOW_STANDARD_FALLBACK=true` only if availability matters more than minimum cost.

## First deployment

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

Then set the returned Worker origin as GitHub repository variable `VITE_AI_API_URL`. Also set `ALLOWED_ORIGIN` on the Worker to the exact GitHub Pages origin before putting real money behind the key.

Optional Worker vars in `wrangler.jsonc`:

- `OPENAI_MODEL` — defaults to `gpt-6-luna`.
- `OPENAI_SERVICE_TIER` — defaults to `flex`; set `default` if latency matters more than cost.
- `OPENAI_ALLOW_STANDARD_FALLBACK` — defaults to `false`; set `true` only if a Standard retry is acceptable.
- `ALLOWED_ORIGIN` — lock browser access to the final GitHub Pages origin. The Worker also rejects mismatched origins before calling OpenAI.

Never place `OPENAI_API_KEY` in Vite variables, repository source, browser code or GitHub Pages configuration.
