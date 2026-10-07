import type { GameActionRequest, PoliticalPolicyId } from '../../shared/gameActions'
import { POLITICAL_POLICY_INFO } from '../game/simulation/politics'
import type { CountryState } from '../game/state/types'

type Props = {
  country: CountryState
  onClose: () => void
  onAction: (action: GameActionRequest) => void
}

const roleNames = {
  finance: 'Финансы',
  economy: 'Экономика',
  interior: 'Внутренние дела',
  foreign: 'Иностранные дела',
} as const

function barWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`
}

export default function PoliticsPanel({ country, onClose, onAction }: Props) {
  const politics = country.politics

  const nudgePolicy = (policy: PoliticalPolicyId, delta: number) => {
    const level = Math.max(0, Math.min(100, politics.policies[policy] + delta))
    onAction({ type: 'SET_POLITICAL_POLICY', policy, level })
  }

  return (
    <aside className="sheet glass">
      <div className="sheet-head">
        <div><div className="eyebrow">Власть</div><h2>Политическая система</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button>
      </div>

      <div className="metric-grid">
        <div className="metric"><span>Стабильность</span><b>{Math.round(politics.stability)}/100</b></div>
        <div className="metric"><span>Легитимность</span><b>{Math.round(politics.legitimacy)}/100</b></div>
        <div className="metric"><span>Коррупция</span><b>{Math.round(politics.corruption)}/100</b></div>
        <div className="metric"><span>Поддержка парламента</span><b>{Math.round(politics.parliamentApproval)}%</b></div>
      </div>

      <div className="section-label">Политический курс</div>
      <div className="policy-tuning-list">
        {(Object.keys(POLITICAL_POLICY_INFO) as PoliticalPolicyId[]).map((id) => {
          const info = POLITICAL_POLICY_INFO[id]
          const value = politics.policies[id]
          return (
            <div className="policy-tuning" key={id}>
              <div className="policy-tuning-head"><b>{info.title}</b><span>{Math.round(value)}</span></div>
              <div className="political-meter"><i style={{ width: barWidth(value) }} /></div>
              <div className="policy-scale"><small>{info.low}</small><small>{info.high}</small></div>
              <div className="policy-controls">
                <button onClick={() => nudgePolicy(id, -10)} disabled={value <= 0}>−10</button>
                <button onClick={() => nudgePolicy(id, 10)} disabled={value >= 100}>+10</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-label">Парламент</div>
      <div className="bloc-list">
        {Object.values(politics.blocs).map((bloc) => (
          <div className="bloc-row" key={bloc.id}>
            <div><b>{bloc.name}</b><small>{bloc.seats} мест · влияние {Math.round(bloc.influence)}</small></div>
            <span>{Math.round(bloc.loyalty)}%</span>
          </div>
        ))}
      </div>

      <div className="section-label">Правительство</div>
      <div className="minister-list">
        {Object.values(politics.ministers).map((minister) => (
          <div className="minister-row" key={minister.role}>
            <div><small>{roleNames[minister.role]}</small><b>{minister.name}</b></div>
            <span>лояльность {Math.round(minister.loyalty)}%</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
