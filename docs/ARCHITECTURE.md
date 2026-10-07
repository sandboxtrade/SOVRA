# SOVRA architecture

SOVRA is split by responsibility rather than by screen or by individual helper. The goal is to make new mechanics cheap to add without turning the repository into hundreds of files.

## State and simulation

`src/game/state/` owns the persistent country schema, defaults and migrations. Browser persistence uses the stable `sovra-game` key; old versioned keys are migration inputs only.

`src/game/simulation/` owns deterministic game rules. Economy, politics, districts, projects, news and time stay separate from React and Three.js. Simulation modules should not know how the UI or 3D world renders a result.

## Actions

`shared/gameActions.ts` is the public command contract.

`src/game/actions/actionRegistry.ts` is the single mutation gateway used by UI controls, free local natural-language parsing and GPT tool calls. A new controllable feature should normally add an action here instead of letting every caller mutate state directly.

## AI

`src/game/ai/` decides whether a command can be handled locally for $0.00. Only ambiguous free-form commands are sent to the Worker.

`worker/src/` owns the OpenAI boundary. The browser never receives the API key. The Worker receives a compact state snapshot and emits game actions rather than arbitrary state patches.

This means a new feature does not require rewriting the AI system: expose a validated action, then optionally teach the compact tool schema about it.

## World

`src/game/world/createWorld.ts` composes the country and maps simulation state to visual state.

Reusable visual responsibilities are intentionally split into only a few medium-sized modules:

- `models/actors.ts` — pedestrians and vehicles;
- `models/buildings.ts` — housing, offices, government, retail and industry;
- `models/environment.ts` — terrain, trees, fields and parks;
- `models/infrastructure.ts` — roads, rail, lamps, bus stops and construction;
- `visual.ts` — shared geometry/material helpers;
- `labels.ts` — lightweight world labels.

Do not put economy or political rules in these files. The world may read state and visualize it, but it should not decide the state.

## UI

`src/app/` owns screen composition and panels. `src/ui/` owns reusable presentation helpers, icons and panel CSS.

The global HUD and world-stage rules stay in `src/styles.css`; panel-heavy rules live in `src/ui/panels.css`. If the interface grows substantially again, split by one major UI subsystem, not by every component.

## Extension rule

For a new gameplay system, the default path is:

1. Add state fields only if persistent data is required.
2. Add one focused simulation module.
3. Expose validated actions only for player/AI-controllable operations.
4. Add UI that dispatches those actions.
5. Let the world visualize state; never let a 3D object become the source of gameplay truth.

This keeps save migration, UI, GPT integration and rendering loosely coupled.
