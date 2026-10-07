# AI cost control

SOVRA is designed to remain usable even with a very small API balance.

## Default command path

1. The client first tries a deliberately narrow local parser for obvious instructions such as changing a tax to a stated percentage, changing a budget priority, changing a political policy, starting one of the existing projects or controlling time.
2. If the command is not unambiguous, it goes to the Worker.
3. The Worker uses `gpt-6-luna` with `reasoning.effort=none`, low text verbosity and `max_output_tokens=220`.
4. The Worker uses Flex processing by default. Standard fallback is disabled by default because it doubles token pricing; it can be explicitly enabled with `OPENAI_ALLOW_STANDARD_FALLBACK=true`.
5. The model receives only a compact state summary and one generic game-action tool.

## Automatic AI

v0.5.0 makes **zero automatic model calls**. Economy ticks, political ticks, rendering and routine news are local.

When AI-written news, diplomacy and scenarios are added, they should be triggered by meaningful events, not by every game day. Recommended default for a tiny personal budget: generate one AI item only when the player opens/answers an important event, with local templates as fallback.

## Budget meter

The client accumulates token usage returned by the Worker and shows an approximate dollar total. The Worker uses model-specific rates for known models and a conservative fallback rate for an unknown model so the meter does not silently undercount. `VITE_AI_BUDGET_USD` defaults to `$3`; when the estimate reaches that number, non-local GPT commands are blocked by the client.

This is a convenience guard, not an OpenAI billing limit. A hard account/project spend limit should also be configured in the OpenAI dashboard.


## Endpoint protection

Set `ALLOWED_ORIGIN` on the Worker to the exact GitHub Pages origin before using the API key. The Worker then rejects browser requests from other origins before calling OpenAI. This is not a substitute for an OpenAI project spend limit; a caller outside a browser can forge an Origin header. For the $3 prototype budget, also keep a hard project/account limit in the OpenAI dashboard.
