import type { GameActionRequest } from '../../shared/gameActions'
import type { CountryState } from '../game/state/types'
import { POLICY_INFO } from '../game/simulation/policies'
import { districtDescription, money } from '../ui/format'
import AiCommandBox from './AiCommandBox'

export type Panel = 'country' | 'cabinet' | 'politics' | 'regions' | 'news' | null

type CommonProps = {
  country: CountryState
  onClose: () => void
}

export function CountryPanel({ country, onClose }: CommonProps) {
  const flow = country.day < 30 ? country.economy.monthAccumulator : country.economy.last30Days
  return (
    <aside className="sheet glass">
      <SheetHeader eyebrow="Страна" title="Состояние республики" onClose={onClose} />
      <div className="metric-grid">
        <Metric label="Население" value={`${(country.population / 1_000_000).toFixed(2)} млн`} />
        <Metric label="ВВП" value={`$${country.gdp.toFixed(1)} млрд`} />
        <Metric label="Инфляция" value={`${country.economy.inflation.toFixed(1)}%`} />
        <Metric label="Средняя зарплата" value={Math.round(country.economy.averageWage).toLocaleString('ru-RU')} />
        <Metric label="Инфраструктура" value={`${Math.round(country.infrastructure)}/100`} />
        <Metric label="Экология" value={`${Math.round(country.ecology)}/100`} />
      </div>
      <div className="section-label">Денежные потоки · {country.day < 30 ? 'текущий период' : 'последние 30 дней'}</div>
      <div className="flow-grid">
        <Flow label="Зарплаты" value={money(flow.payroll)} />
        <Flow label="Потребление" value={money(flow.householdConsumption)} />
        <Flow label="Налоги" value={money(flow.taxRevenue)} />
        <Flow label="Расходы бюджета" value={money(flow.publicSpending)} />
        <Flow label="Инвестиции бизнеса" value={money(flow.businessInvestment)} />
        <Flow label="Баланс бюджета" value={money(flow.budgetBalance)} negative={flow.budgetBalance < 0} />
      </div>
      <p className="sheet-copy">Экономика теперь считает движение денег между домохозяйствами, бизнесом и государством. Карта продолжает показывать результат этих процессов, а не отдельную декоративную шкалу.</p>
    </aside>
  )
}

type CabinetProps = CommonProps & {
  onStartProject: (id: keyof typeof POLICY_INFO) => void
  onActions: (actions: GameActionRequest[]) => string
}

export function CabinetPanel({ country, onClose, onStartProject, onActions }: CabinetProps) {
  return (
    <aside className="sheet glass">
      <SheetHeader eyebrow="Кабинет" title="Управление страной" onClose={onClose} />
      <AiCommandBox country={country} onActions={onActions} />

      {country.projects.length > 0 && (
        <div className="project-stack">
          {country.projects.map((project) => (
            <div className="project" key={project.id}>
              <div className="project-line"><b>{project.title}</b><span>{Math.floor(project.progress)}%</span></div>
              <div className="progress"><i style={{ width: `${project.progress}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="section-label">Готовые программы</div>
      <div className="policy-list">
        {Object.entries(POLICY_INFO).map(([id, info]) => {
          const projectId = id as keyof typeof POLICY_INFO
          const active = country.projects.some((project) => project.kind === projectId)
          return (
            <button
              key={id}
              className="policy-button"
              disabled={active || country.treasury < info.cost}
              onClick={() => onStartProject(projectId)}
            >
              <span>{info.title}</span>
              <small>{info.description}</small>
              <em>{active ? 'в работе' : `${info.cost} млрд`}</em>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export function RegionsPanel({ country, onClose }: CommonProps) {
  return (
    <aside className="sheet glass">
      <SheetHeader eyebrow="Территория" title="Районы страны" onClose={onClose} />
      <div className="region-list">
        {Object.values(country.districts).map((district) => (
          <div className="region-row" key={district.id}>
            <div><b>{district.name}</b><small>{districtDescription(district)}</small></div>
            <span>{Math.round(district.population / 1000)}k</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function NewsPanel({ country, onClose }: CommonProps) {
  return (
    <aside className="sheet glass">
      <SheetHeader eyebrow="Лента" title="Что происходит" onClose={onClose} />
      <div className="news-list">
        {country.news.map((item) => (
          <article className={`news-item ${item.tone}`} key={item.id}>
            <span>День {item.day}</span>
            <b>{item.title}</b>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </aside>
  )
}

function SheetHeader({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) {
  return (
    <div className="sheet-head">
      <div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>
      <button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><b>{value}</b></div>
}

function Flow({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
  return <div className="flow-row"><span>{label}</span><b className={negative ? 'negative-value' : ''}>{value}</b></div>
}
