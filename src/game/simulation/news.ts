import type { CountryState, NewsItem } from '../state/types'

export function pushNews(state: CountryState, item: Omit<NewsItem, 'id' | 'day'>): CountryState {
  const news: NewsItem = { ...item, id: `n-${state.serial}`, day: state.day }
  return {
    ...state,
    serial: state.serial + 1,
    news: [news, ...state.news].slice(0, 50),
  }
}

export function maybeGenerateSystemNews(state: CountryState): CountryState {
  if (state.day <= 1 || state.day % 15 !== 0) return state

  if (state.politics.stability < 34 || state.approval < 34) {
    return pushNews(state, {
      title: 'У здания правительства собираются протестующие',
      body: `Поддержка власти опустилась до ${Math.round(state.approval)}%, политическая стабильность — до ${Math.round(state.politics.stability)}/100. Давление на кабинет растёт.`,
      tone: 'negative',
    })
  }

  if (state.politics.corruption < 32 && state.politics.policies.antiCorruption > 65) {
    return pushNews(state, {
      title: 'Антикоррупционная кампания меняет аппарат',
      body: 'Проверки и прозрачность закупок постепенно снижают влияние неформальных сетей внутри государства.',
      tone: 'positive',
    })
  }

  if (state.economy.inflation > 14) {
    return pushNews(state, {
      title: 'Рост цен становится главной темой недели',
      body: `Годовая инфляция приблизилась к ${state.economy.inflation.toFixed(1)}%. Домохозяйства сокращают необязательные расходы.`,
      tone: 'negative',
    })
  }

  if (state.employment > 77 && state.prosperity > 43) {
    return pushNews(state, {
      title: 'Рынок труда заметно оживился',
      body: 'Компании расширяют найм, а деловая активность всё сильнее отражается на улицах столицы и регионов.',
      tone: 'positive',
    })
  }

  if (state.infrastructure < 35) {
    return pushNews(state, {
      title: 'Регионы требуют денег на инфраструктуру',
      body: 'Муниципалитеты сообщают о росте аварийных участков дорог и износе коммунальной сети.',
      tone: 'negative',
    })
  }

  return pushNews(state, {
    title: 'Экономика проходит очередной месяц без резких потрясений',
    body: 'Основные показатели остаются стабильными, однако бизнес продолжает внимательно следить за решениями правительства.',
    tone: 'neutral',
  })
}
