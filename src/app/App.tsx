import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameActionRequest, GameSpeed, ProjectId } from '../../shared/gameActions'
import { dispatchGameAction, dispatchGameActions } from '../game/actions/actionRegistry'
import { advanceTime } from '../game/simulation/engine'
import { loadGame, saveGame } from '../game/state/persistence'
import type { CountryState } from '../game/state/types'
import GameCanvas from '../game/world/GameCanvas'
import { conditionText } from '../ui/format'
import { CabinetPanel, CountryPanel, NewsPanel, type Panel, RegionsPanel } from './Panels'
import PoliticsPanel from './PoliticsPanel'

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
  const togglePanel = (next: Exclude<Panel, null>) => setPanel((current) => current === next ? null : next)

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

      <header className="topbar glass">
        <div><div className="eyebrow">SOVRA · v0.4.1</div><div className="country-name">Республика Северная</div></div>
        <div className="clock-block"><strong>День {country.day}</strong><span>{timeText}</span></div>
      </header>

      <section className="status-strip glass" aria-label="Состояние страны">
        <span><b>{Math.round(country.treasury)}</b> млрд</span>
        <span>занятость <b>{Math.round(country.employment)}%</b></span>
        <span>инфляция <b>{country.economy.inflation.toFixed(1)}%</b></span>
        <span>поддержка <b>{Math.round(country.approval)}%</b></span>
        <span className="status-word">{nationalMood}</span>
      </section>

      <div className="map-hint glass">Перетаскивай карту · щипок — масштаб</div>

      <div className="speed glass" aria-label="Скорость времени">
        <button className={country.speed === 0 ? 'active' : ''} onClick={() => setSpeed(0)} aria-label="Пауза">Ⅱ</button>
        <button className={country.speed === 1 ? 'active' : ''} onClick={() => setSpeed(1)}>×1</button>
        <button className={country.speed === 4 ? 'active' : ''} onClick={() => setSpeed(4)}>×4</button>
      </div>

      {panel === 'country' && <CountryPanel country={country} onClose={() => setPanel(null)} />}
      {panel === 'cabinet' && <CabinetPanel country={country} onClose={() => setPanel(null)} onStartProject={startProject} onActions={applyActions} />}
      {panel === 'politics' && <PoliticsPanel country={country} onClose={() => setPanel(null)} onAction={applyAction} />}
      {panel === 'regions' && <RegionsPanel country={country} onClose={() => setPanel(null)} />}
      {panel === 'news' && <NewsPanel country={country} onClose={() => setPanel(null)} />}

      <nav className="bottom-nav glass" aria-label="Основное меню">
        <button className={panel === 'country' ? 'selected' : ''} onClick={() => togglePanel('country')}><span>◈</span>Страна</button>
        <button className={panel === 'cabinet' ? 'selected' : ''} onClick={() => togglePanel('cabinet')}><span>▣</span>Кабинет</button>
        <button className={panel === 'politics' ? 'selected' : ''} onClick={() => togglePanel('politics')}><span>♜</span>Власть</button>
        <button className={panel === 'regions' ? 'selected' : ''} onClick={() => togglePanel('regions')}><span>⌁</span>Районы</button>
        <button className={panel === 'news' ? 'selected' : ''} onClick={() => togglePanel('news')}><span>▤</span>Новости</button>
      </nav>
    </main>
  )
}
