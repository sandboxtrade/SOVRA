export const PROJECT_IDS = ['roads', 'industry', 'districts', 'smallBusiness', 'transit', 'cleanup'] as const
export const TAX_IDS = ['income', 'business', 'sales'] as const
export const BUDGET_AREAS = ['infrastructure', 'education', 'health', 'security'] as const
export const POLITICAL_POLICY_IDS = ['mediaFreedom', 'executivePower', 'localAutonomy', 'policePowers', 'antiCorruption'] as const
export const GAME_SPEEDS = [0, 1, 4] as const

export type ProjectId = (typeof PROJECT_IDS)[number]
export type TaxId = (typeof TAX_IDS)[number]
export type BudgetArea = (typeof BUDGET_AREAS)[number]
export type PoliticalPolicyId = (typeof POLITICAL_POLICY_IDS)[number]
export type GameSpeed = (typeof GAME_SPEEDS)[number]

export type GameActionRequest =
  | { type: 'START_PROJECT'; project: ProjectId }
  | { type: 'SET_TAX_RATE'; tax: TaxId; rate: number }
  | { type: 'SET_BUDGET_PRIORITY'; area: BudgetArea; level: number }
  | { type: 'SET_POLITICAL_POLICY'; policy: PoliticalPolicyId; level: number }
  | { type: 'SET_GAME_SPEED'; speed: GameSpeed }

export type AiToolCall = {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export const AI_ACTION_KINDS = ['project', 'tax', 'budget', 'politics', 'speed'] as const
export type AiActionKind = (typeof AI_ACTION_KINDS)[number]

const ALL_TARGETS = [
  ...PROJECT_IDS,
  ...TAX_IDS,
  ...BUDGET_AREAS,
  ...POLITICAL_POLICY_IDS,
  'simulation',
] as const

/**
 * One compact AI tool is used instead of one schema per game function.
 * This keeps token overhead low as the game grows. The browser validates
 * the translated GameActionRequest again before mutating state.
 */
export const AI_EXECUTE_TOOL = {
  type: 'function',
  name: 'execute_game_action',
  description: [
    'Apply one SOVRA game action.',
    `project targets: ${PROJECT_IDS.join(', ')} (value=null).`,
    `tax targets: ${TAX_IDS.join(', ')} (value=0..60).`,
    `budget targets: ${BUDGET_AREAS.join(', ')} (value=0..100).`,
    `politics targets: ${POLITICAL_POLICY_IDS.join(', ')} (value=0..100).`,
    'speed target: simulation (value=0,1,4).',
  ].join(' '),
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: [...AI_ACTION_KINDS] },
      target: { type: 'string', enum: [...ALL_TARGETS] },
      value: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    },
    required: ['action', 'target', 'value'],
    additionalProperties: false,
  },
} as const
