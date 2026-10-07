import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameActionRequest, GameSpeed, ProjectId } from '../../shared/gameActions'
import { dispatchGameAction, dispatchGameActions } from '../game/actions/actionRegistry'
import { advanceTime } from '../game/simulation/engine'
import { loadGame, saveGame } from '../game/state/persistence'
import type { CountryState } from '../game/state/types'
import GameCanvas from '../game/world/GameCanvas'
import { ApprovalIcon, CabinetIcon, CountryIcon, InflationIcon, NewsIcon, PeopleIcon, PoliticsIcon, RegionsIcon, TreasuryIcon } from '../ui/Icons'
import { conditionText } from '../ui/format'
import { CabinetPanel, CountryPanel, NewsPanel, type Panel, RegionsPanel } from './Panels'
import PoliticsPanel from './PoliticsPanel'

const navItems = [
  { id: 'country', label: 'Страна', Icon: CountryIcon },
  { id: 'cabinet', label: 'Кабинет', Icon: CabinetIcon },
  { id: 'politics', label: 'Власть', Icon: PoliticsIcon },
  { id: 'regions', label: 'Районы', Icon: RegionsIcon },
  { id: 'news', label: 'Новости', Icon: NewsIcon },
] as const

export default function App() {
  const [country, setCountry] = useState<CountryState>(() => loadGame())
  const [panel, setPanel] = useState<Panel>(null)
  const previousRef = useRef(performance.now())
  const countryRef = useRef(country)
  countryRef.current = country

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now()
      const delta = Math.min((now - previousRef.current) / 1000, 0.35)
      previousRef.current = now
      setCountry((state) => advanceTime(state, delta))
    }, 200)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => saveGame(country), 350)
    return () => window.clearTimeout(id)
  }, [country])

  const timeText = useMemo(() => {
    const h = Math.floor(country.hour)
    const m = Math.floor((country.hour - h) * 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }, [country.hour])

  const nationalMood = conditionText(country.prosperity, 'стагнация', 'стабилизация', 'рост')
  const crisis = country.politics.stability < 35 || country.approval < 35
  const togglePanel = (next: Exclude<Panel, null>) => setPanel((current) => current === next ? null : next)
  const overviewText = crisis
    ? 'давление на власть растёт, нужен быстрый ответ'
    : country.infrastructure < 40
      ? 'идёт тяжёлая перестройка страны'
      : country.prosperity > 50
        ? 'ощущается оживление и восстановление'
        : 'страна выходит из затяжной стагнации'

  const applyAction = (action: GameActionRequest) => setCountry((state) => {
    const next = dispatchGameAction(state, action).state
    countryRef.current = next
    return next
  })
  const applyActions = (actions: GameActionRequest[]) => {
    const result = dispatchGameActions(countryRef.current, actions)
    countryRef.current = result.state
    setCountry(result.state)
    return result.message
  }
  const setSpeed = (speed: GameSpeed) => applyAction({ type: 'SET_GAME_SPEED', speed })
  const startProject = (project: ProjectId) => applyAction({ type: 'START_PROJECT', project })

  return (
    <main className="app-shell">
      <GameCanvas state={country} />
      <div className="world-vignette" aria-hidden="true" />

      <header className="command-header glass-panel">
        <div className="state-mark" aria-hidden="true"><span>S</span></div>
        <div className="state-title">
          <div className="eyebrow">SOVRA · v0.6.0</div>
          <div className="country-name">Республика Северная</div>
        </div>
        <div className="date-card">
          <span>День {country.day}</span>
          <strong>{timeText}</strong>
        </div>
      </header>

      <section className="hud-metrics" aria-label="Состояние страны">
        <HudMetric Icon={TreasuryIcon} label="Казна" value={`${Math.round(country.treasury)} млрд`} />
        <HudMetric Icon={PeopleIcon} label="Занятость" value={`${Math.round(country.employment)}%`} />
        <HudMetric Icon={InflationIcon} label="Инфляция" value={`${country.economy.inflation.toFixed(1)}%`} tone={country.economy.inflation > 8 ? 'warning' : undefined} />
        <HudMetric Icon={ApprovalIcon} label="Поддержка" value={`${Math.round(country.approval)}%`} tone={country.approval < 35 ? 'danger' : country.approval > 60 ? 'good' : undefined} />
      </section>

      <div className={`situation-pill glass-panel ${crisis ? 'danger' : ''}`}>
        <i />
        <span>{crisis ? 'напряжённая обстановка' : nationalMood}</span>
      </div>

      <section className="focus-card glass-panel" aria-label="Краткий обзор страны">
        <div className="focus-head">
          <div>
            <span>Краткий обзор</span>
            <strong>{overviewText}</strong>
          </div>
          <em>{country.gdp.toFixed(1)} ВВП</em>
        </div>
        <div className="focus-grid">
          <div><small>Население</small><b>{(country.population / 1_000_000).toFixed(2)} млн</b></div>
          <div><small>Инфраструктура</small><b>{Math.round(country.infrastructure)}%</b></div>
          <div><small>Экология</small><b>{Math.round(country.ecology)}%</b></div>
        </div>
      </section>

      <div className="map-hint glass-panel">перемещай карту · щипок — масштаб</div>

      <div className="speed-control glass-panel" aria-label="Скорость времени">
        <small>Время</small>
        <div className="speed-buttons">
          <button className={country.speed === 0 ? 'active' : ''} onClick={() => setSpeed(0)} aria-label="Пауза"><span>Ⅱ</span></button>
          <button className={country.speed === 1 ? 'active' : ''} onClick={() => setSpeed(1)} aria-label="Обычная скорость"><span>1×</span></button>
          <button className={country.speed === 4 ? 'active' : ''} onClick={() => setSpeed(4)} aria-label="Ускорить"><span>4×</span></button>
        </div>
      </div>

      {panel === 'country' && <CountryPanel country={country} onClose={() => setPanel(null)} />}
      {panel === 'cabinet' && <CabinetPanel country={country} onClose={() => setPanel(null)} onStartProject={startProject} onActions={applyActions} />}
      {panel === 'politics' && <PoliticsPanel country={country} onClose={() => setPanel(null)} onAction={applyAction} />}
      {panel === 'regions' && <RegionsPanel country={country} onClose={() => setPanel(null)} />}
      {panel === 'news' && <NewsPanel country={country} onClose={() => setPanel(null)} />}

      <nav className="bottom-dock glass-panel" aria-label="Основное меню">
        {navItems.map(({ id, label, Icon }) => (
          <button key={id} className={panel === id ? 'selected' : ''} onClick={() => togglePanel(id)}>
            <span className="nav-icon"><Icon /></span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
    </main>
  )
}

function HudMetric({ Icon, label, value, tone }: { Icon: typeof TreasuryIcon; label: string; value: string; tone?: 'warning' | 'danger' | 'good' }) {
  return (
    <div className={`hud-metric glass-panel ${tone ?? ''}`}>
      <span className="hud-metric-icon"><Icon /></span>
      <span className="hud-metric-copy"><small>{label}</small><b>{value}</b></span>
    </div>
  )
}
