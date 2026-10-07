# SOVRA v0.6.0

Mobile-first political/economic sandbox with a living miniature 3D country. Simulation, AI control and presentation remain separate systems so new mechanics can be added without rebuilding the project around them.

## v0.6.0 — visual overhaul

This release intentionally prioritizes presentation over new mechanics.

- Rebuilt vehicles with correct forward orientation, wheels, glazing, bumpers and lights. Cars, buses and trucks now have distinct silhouettes.
- Rebuilt pedestrians as small articulated rigs with torso, head, hair, arms and legs. Walking now has an actual gait animation instead of sliding blocks.
- Rebuilt panel housing with plinths, facade seams, varied window-light groups, balconies, entrances, canopies and rooftop equipment.
- Reworked government, offices, private houses and the industrial plant with stronger silhouettes and secondary detail.
- Added shops, warehouses, a park, benches, bus stops, crosswalks, gutters, curbs and denser street furniture.
- Added restrained in-world district labels so the country reads faster at phone scale.
- Improved daylight/twilight/night treatment, softer shadows, tone mapping, fog and render resolution.
- New command-center HUD with a proper identity header, icon-based state metrics, situation indicator, vertical time controls and a cleaner bottom dock.
- Panel styling was split from global HUD styling instead of allowing one huge CSS file to keep growing.
- World models are now split into `models/actors`, `models/buildings`, `models/environment` and `models/infrastructure`; this is enough separation for maintenance without creating hundreds of tiny files.
- Save storage now uses a stable `sovra-game` key and migrates prior v0.4/v0.3/v0.2 saves. Future visual releases no longer need a new save key.
- GitHub Pages workflow uses `npm install --no-audit --no-fund`, so it does not require a committed `package-lock.json`.

## Existing systems retained

- Economy: salaries, consumption, business, taxation, budget flows, inflation, employment and sectors.
- Politics: stability, legitimacy, corruption, parliament, blocs, ministers and political policy axes.
- Living visual state: traffic, pedestrians, lighting, pollution, neglect, construction and protests react to simulation state.
- AI actions: one compact action gateway shared by local commands and the OpenAI Worker.
- Low-cost AI path: literal commands stay local for $0.00; GPT is only used for ambiguous free-form commands.
- Default local API guard remains $3 and automatic GPT calls are still disabled.

## Project layout

```text
src/app/                      React shell and game panels
src/game/state/               state schema, defaults, stable persistence/migrations
src/game/simulation/          economy, politics, districts, projects, news, time
src/game/actions/             validated mutation gateway
src/game/ai/                  compact state, free local parser, API client, usage meter
src/game/world/createWorld.ts world composition and state-driven visual behavior
src/game/world/models/        actors, buildings, environment, infrastructure
src/game/world/labels.ts      lightweight in-world labels
src/game/world/visual.ts      shared procedural materials/geometry helpers
src/ui/                       icons, formatters and panel styling
shared/                       browser/Worker action contracts
worker/src/                   OpenAI proxy, prompts, cost control and routing
```

The structure is deliberately medium-grained. Add a focused module when a system has its own responsibility; do not create a file for every helper.

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

The browser never receives `OPENAI_API_KEY`. Deploy `worker/` separately to Cloudflare and keep the key in Worker secret storage. See `worker/README.md` and `docs/AI_COST_CONTROL.md`.
