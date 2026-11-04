import { parseYmd, toMinutes, weekdayIndex } from './dates'
import type { Block, PlanSession, StudyLog } from './types'

/** Um compromisso de estudo do dia: bloco semanal fixo ou sessão datada do cronograma. */
export interface AgendaItem {
  id: string // chave única (b:… ou s:…)
  kind: 'block' | 'session'
  refId: string // id real do bloco ou da sessão
  start_time: string
  minutes: number
  subject_id: string | null
  label: string | null // foco do bloco ou conteúdo da sessão
  done: boolean
  doneMin: number
}

export function agendaForDay(day: string, blocks: Block[], sessions: PlanSession[], logs: StudyLog[]): AgendaItem[] {
  const wd = weekdayIndex(parseYmd(day))
  const items: AgendaItem[] = []
  for (const b of blocks) {
    if (b.weekday !== wd) continue
    const doneMin = logs.filter((l) => l.block_id === b.id && l.studied_on === day).reduce((n, l) => n + l.minutes, 0)
    items.push({ id: `b:${b.id}`, kind: 'block', refId: b.id, start_time: b.start_time, minutes: b.minutes, subject_id: b.subject_id, label: b.title, done: doneMin > 0, doneMin })
  }
  for (const s of sessions) {
    if (s.planned_on !== day) continue
    const logged = logs.filter((l) => l.plan_session_id === s.id).reduce((n, l) => n + l.minutes, 0)
    items.push({ id: `s:${s.id}`, kind: 'session', refId: s.id, start_time: s.start_time, minutes: s.minutes, subject_id: s.subject_id, label: s.topic, done: s.done, doneMin: s.done ? logged || s.minutes : 0 })
  }
  return items.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
}
