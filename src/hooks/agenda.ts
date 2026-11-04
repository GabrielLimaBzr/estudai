import type { Study } from '@/hooks/useStudy'
import type { AgendaItem } from '@/lib/agenda'
import type { PlanSession } from '@/lib/types'

/**
 * Concluir uma sessão do cronograma: registra o tempo, marca a sessão como feita e conta mais uma aula na matéria.
 * Tudo em sequência; se o registro falhar, nada é marcado.
 */
export async function completeSession(study: Study, s: PlanSession, day: string, minutes = s.minutes): Promise<boolean> {
  const log = await study.logs.insert({ subject_id: s.subject_id, plan_session_id: s.id, studied_on: day, minutes, note: s.topic }, 'registrar a sessão')
  if (!log) return false
  if (!(await study.sessions.patch(s.id, { done: true }, 'marcar a sessão'))) return false
  const subj = study.subjects.rows.find((x) => x.id === s.subject_id)
  if (subj) await study.subjects.patch(subj.id, { watched_lessons: subj.watched_lessons + 1 }, 'atualizar as aulas')
  return true
}

export async function undoSession(study: Study, s: PlanSession): Promise<boolean> {
  for (const l of study.logs.rows.filter((x) => x.plan_session_id === s.id)) if (!(await study.logs.remove(l.id, 'desfazer o registro'))) return false
  if (!(await study.sessions.patch(s.id, { done: false }, 'desfazer a sessão'))) return false
  const subj = study.subjects.rows.find((x) => x.id === s.subject_id)
  if (subj) await study.subjects.patch(subj.id, { watched_lessons: Math.max(0, subj.watched_lessons - 1) }, 'atualizar as aulas')
  return true
}

/** Marca como feito um item da agenda do dia (bloco semanal ou sessão do cronograma). */
export async function completeItem(study: Study, item: AgendaItem, day: string): Promise<boolean> {
  if (item.kind === 'session') {
    const s = study.sessions.rows.find((x) => x.id === item.refId)
    return s ? completeSession(study, s, day) : false
  }
  return !!(await study.logs.insert({ subject_id: item.subject_id, block_id: item.refId, studied_on: day, minutes: item.minutes }, 'registrar o bloco'))
}

export async function undoItem(study: Study, item: AgendaItem, day: string): Promise<boolean> {
  if (item.kind === 'session') {
    const s = study.sessions.rows.find((x) => x.id === item.refId)
    return s ? undoSession(study, s) : false
  }
  for (const l of study.logs.rows.filter((x) => x.block_id === item.refId && x.studied_on === day)) await study.logs.remove(l.id, 'desfazer o registro')
  return true
}
