import { useState } from 'react'
import type { GameActionRequest } from '../../shared/gameActions'
import { toolCallToAction } from '../game/actions/actionRegistry'
import { isAiConfigured, sendAiCommand } from '../game/ai/aiClient'
import { configuredAiBudgetUsd, getAiUsageSummary, recordLocalCommand, recordPaidUsage } from '../game/ai/aiUsage'
import { interpretLocally } from '../game/ai/localCommand'
import type { CountryState } from '../game/state/types'

type Props = {
  country: CountryState
  onActions: (actions: GameActionRequest[]) => string
}

export default function AiCommandBox({ country, onActions }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState('')
  const [usage, setUsage] = useState(() => getAiUsageSummary())
  const configured = isAiConfigured()
  const budgetReached = usage.estimatedUsd >= configuredAiBudgetUsd

  const submit = async () => {
    const message = text.trim()
    if (!message || busy) return

    const local = interpretLocally(message)
    if (local) {
      const localResult = onActions(local.actions)
      setUsage(recordLocalCommand())
      setAnswer([local.message, localResult].filter(Boolean).join(' '))
      setText('')
      return
    }

    if (!configured) {
      setAnswer('Для свободной команды нужен AI Worker. Простые числовые команды работают локально и бесплатно.')
      return
    }
    if (budgetReached) {
      setAnswer('Локальный лимит бюджета API достигнут. Простые команды продолжат работать бесплатно.')
      return
    }

    setBusy(true)
    setAnswer('')
    try {
      const response = await sendAiCommand(message, country)
      const actions = response.toolCalls.map(toolCallToAction).filter((action): action is GameActionRequest => action !== null)
      const localResult = actions.length ? onActions(actions) : ''
      setUsage(recordPaidUsage(response.usage))
      setAnswer([response.message, localResult].filter(Boolean).join(' '))
      setText('')
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : 'Не удалось связаться с ИИ-контуром.')
    } finally {
      setBusy(false)
    }
  }

  const spendText = `$${usage.estimatedUsd.toFixed(4)} / $${configuredAiBudgetUsd.toFixed(2)}`

  return (
    <section className="ai-box" aria-label="ИИ-управление государством">
      <div className="ai-title">
        <div>
          <b>Свободное решение</b>
          <small>{configured ? 'локально бесплатно → GPT только если нужно' : 'простые команды локально · GPT пока не подключён'}</small>
        </div>
        <span className={configured && !budgetReached ? 'ai-dot on' : 'ai-dot'} />
      </div>
      <textarea
        value={text}
        disabled={busy}
        onChange={(event: { target: { value: string } }) => setText(event.target.value)}
        placeholder="Например: снизь налог на прибыль до 12% или придумай более сложное решение своими словами."
        maxLength={700}
      />
      <button className="ai-send" type="button" disabled={busy || !text.trim()} onClick={submit}>
        {busy ? 'Обрабатываю…' : 'Передать правительству'}
      </button>
      <div className="ai-cost-row">
        <span>API ≈ {spendText}</span>
        <span>{usage.paidRequests} GPT · {usage.localCommands} бесплатно</span>
      </div>
      {answer && <p className="ai-answer">{answer}</p>}
    </section>
  )
}
