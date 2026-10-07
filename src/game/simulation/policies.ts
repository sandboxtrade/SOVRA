import type { CountryState, ProjectId, ProjectState } from '../state/types'
import { clamp, round } from './math'
import { pushNews } from './news'

export const POLICY_INFO: Record<ProjectId, { title: string; cost: number; days: number; description: string }> = {
  roads: { title: 'Ремонт дорожной сети', cost: 30, days: 24, description: 'Дороги ремонтируются постепенно. Улучшает инфраструктуру.' },
  industry: { title: 'Поддержка промышленности', cost: 40, days: 30, description: 'Рабочие места и производство ценой нагрузки на экологию.' },
  districts: { title: 'Реновация жилых районов', cost: 35, days: 34, description: 'Обновляет старый жилой фонд, дворы и локальную инфраструктуру.' },
  smallBusiness: { title: 'Льготы малому бизнесу', cost: 18, days: 22, description: 'Стимулирует услуги, торговлю и локальную занятость.' },
  transit: { title: 'Обновление транспорта', cost: 28, days: 28, description: 'Повышает связность районов и качество городской среды.' },
  cleanup: { title: 'Программа благоустройства', cost: 16, days: 20, description: 'Уборка, озеленение и восстановление общественных пространств.' },
}

export function startProject(state: CountryState, id: ProjectId): CountryState {
  const info = POLICY_INFO[id]
  if (state.treasury < info.cost || state.projects.some((project) => project.kind === id)) return state

  const project: ProjectState = {
    id: `p-${state.serial}`,
    kind: id,
    title: info.title,
    progress: 0,
    durationDays: info.days,
    startedDay: state.day,
  }

  let next: CountryState = {
    ...state,
    treasury: round(state.treasury - info.cost),
    projects: [...state.projects, project],
  }
  next = pushNews(next, {
    title: `${info.title}: работы начались`,
    body: `Правительство выделило ${info.cost} млрд. Эффект будет накапливаться по мере выполнения программы.`,
    tone: 'neutral',
  })
  return next
}

function applyDailyProjectEffect(state: CountryState, project: ProjectState): CountryState {
  const progress = Math.min(100, project.progress + 100 / project.durationDays)
  let next = state

  switch (project.kind) {
    case 'roads':
      next = { ...next, infrastructure: clamp(next.infrastructure + 0.42), prosperity: clamp(next.prosperity + 0.06) }
      break
    case 'industry':
      next = {
        ...next,
        employment: clamp(next.employment + 0.18),
        prosperity: clamp(next.prosperity + 0.1),
        ecology: clamp(next.ecology - 0.11),
        economy: {
          ...next.economy,
          businessCash: round(next.economy.businessCash + 0.08, 3),
          sectors: {
            ...next.economy.sectors,
            industry: {
              ...next.economy.sectors.industry,
              confidence: clamp(next.economy.sectors.industry.confidence + 0.3),
            },
          },
        },
      }
      break
    case 'districts':
      next = { ...next, prosperity: clamp(next.prosperity + 0.2), infrastructure: clamp(next.infrastructure + 0.12), approval: clamp(next.approval + 0.08) }
      break
    case 'smallBusiness':
      next = {
        ...next,
        employment: clamp(next.employment + 0.12),
        prosperity: clamp(next.prosperity + 0.12),
        economy: {
          ...next.economy,
          sectors: {
            ...next.economy.sectors,
            services: {
              ...next.economy.sectors.services,
              firms: next.economy.sectors.services.firms + 2,
              confidence: clamp(next.economy.sectors.services.confidence + 0.36),
            },
          },
        },
      }
      break
    case 'transit':
      next = { ...next, infrastructure: clamp(next.infrastructure + 0.27), ecology: clamp(next.ecology + 0.06), approval: clamp(next.approval + 0.05) }
      break
    case 'cleanup':
      next = { ...next, ecology: clamp(next.ecology + 0.34), approval: clamp(next.approval + 0.11), prosperity: clamp(next.prosperity + 0.04) }
      break
  }

  return {
    ...next,
    projects: next.projects.map((candidate) => candidate.id === project.id ? { ...candidate, progress } : candidate),
  }
}

export function stepProjects(state: CountryState): CountryState {
  let next = state
  for (const project of state.projects) next = applyDailyProjectEffect(next, project)

  const finished = next.projects.filter((project) => project.progress >= 99.999)
  if (!finished.length) return next

  next = { ...next, projects: next.projects.filter((project) => project.progress < 99.999) }
  for (const project of finished) {
    next = pushNews(next, {
      title: `${project.title} завершена`,
      body: 'Финальная стадия программы закончена. Дальнейший эффект будет зависеть от экономики и качества содержания инфраструктуры.',
      tone: 'positive',
    })
  }
  return next
}
