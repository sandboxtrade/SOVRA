# SOVRA v0.4.1

Mobile-first political/economic sandbox with a living miniature 3D country. The visual layer is lightweight 3D with procedural pixel textures; simulation, politics, AI commands and rendering are separate systems.

## v0.4.1

Audit/fix release over v0.4.0:

- Fixed the free local command parser so years before a command, negation and relative phrases such as “lower by 5%” cannot silently become the wrong absolute action.
- Save/AI usage writes no longer crash the game when browser storage is unavailable or full.
- Save hydration now deep-merges sectors, districts, blocs and ministers, making future schema additions safer.
- AI client validates Worker responses and aborts a stuck request after 60 seconds.
- AI cost estimation is model-aware and deliberately conservative for unknown models.
- Flex → Standard retry is now opt-in, not automatic, so the Worker does not silently double token pricing.
- Worker rejects mismatched browser origins when `ALLOWED_ORIGIN` is configured and sends `no-store` responses.
- Worker TypeScript is included in the root project type-check.

- Political simulation: stability, legitimacy, corruption and parliament support.
- Four parliamentary blocs with different interests; loyalty changes from the actual state of the country and the political course.
- Government ministers with competence, loyalty and ambition.
- Five political policy axes: media freedom, executive power, regional autonomy, police powers and anti-corruption pressure.
- Political deterioration can now appear directly in the 3D country as a protest crowd near the government building.
- Save schema v4 with migration from v0.3/v0.2/STATE saves.
- AI command layer rebuilt for very low API spend.
- One compact `execute_game_action` function tool now fronts all exposed game actions instead of adding a large tool schema for every feature.
- Literal numeric commands are parsed locally for $0.00; GPT is called only when the command is not obvious.
- Default model: `gpt-6-luna`, reasoning disabled, low verbosity, capped output.
- Default API processing tier: `flex` for lower token cost; Standard fallback is opt-in and disabled by default.
- Compact state snapshot instead of sending the whole save/world to the model.
- In-game approximate API usage meter and configurable local budget guard (default $3).
- No automatic GPT calls yet: time simulation, economy and ordinary news cost nothing.

## Project layout

```text
src/app/                 React shell and panels
src/game/state/          state schema, defaults, save migration
src/game/simulation/     economy, politics, districts, projects, news, time
src/game/actions/        single validated mutation gateway
src/game/ai/             compact snapshot, free local parser, API client, usage meter
src/game/world/          Three.js country, lightweight models, living visual layer
src/ui/                  presentation helpers
shared/                  browser/Worker action contracts
worker/src/              OpenAI proxy split into routing, prompts, costs and API call
```

The folders are intentionally coarse. New mechanics should normally add one focused simulation module and, only if controllable, one action in the shared action contract. Do not create one file per tiny function.

## Run

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
```

## GitHub Pages

`.github/workflows/deploy-pages.yml` publishes the client after each push to `main`.

GitHub: `Settings → Pages → Source → GitHub Actions`.

Optional repository variables:

- `VITE_AI_API_URL` — deployed Worker URL.
- `VITE_AI_BUDGET_USD` — local in-game budget guard; defaults to `3`.

## AI

The browser never gets `OPENAI_API_KEY`. Deploy `worker/` separately to Cloudflare and store the key with Wrangler secret storage. See `worker/README.md` and `docs/AI_COST_CONTROL.md`.
