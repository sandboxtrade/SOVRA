import type { CountryState } from '../state/types'

/**
 * Small, stable snapshot for LLM calls. Rendering data and verbose history stay client-side.
 * Short keys are deliberate: this endpoint can be used hundreds of times without paying to
 * resend the whole CountryState.
 */
export function buildAiSnapshot(state: CountryState) {
  return {
    d: state.day,
    t: Math.round(state.hour * 10) / 10,
    tr: Math.round(state.treasury * 10) / 10,
    g: Math.round(state.gdp * 10) / 10,
    db: Math.round(state.debt * 10) / 10,
    pop: state.population,
    emp: Math.round(state.employment),
    inf: Math.round(state.economy.inflation * 10) / 10,
    pr: Math.round(state.prosperity),
    infra: Math.round(state.infrastructure),
    eco: Math.round(state.ecology),
    ap: Math.round(state.approval),
    tx: state.economy.taxRates,
    bp: state.economy.budgetPriorities,
    pol: {
      st: Math.round(state.politics.stability),
      lg: Math.round(state.politics.legitimacy),
      cor: Math.round(state.politics.corruption),
      pa: Math.round(state.politics.parliamentApproval),
      p: state.politics.policies,
    },
    pj: state.projects.map((project) => [project.kind, Math.round(project.progress)]),
  }
}
