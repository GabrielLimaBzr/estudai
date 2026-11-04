import { addDays, daysBetween, isoWeek, parseYmd, toMinutes, ymd } from './dates'
import type { Block, StudyLog, Subject, Task } from './types'

/** % concluído (0–100, inteiro). Sem aulas cadastradas = 0. */
export const progressPct = (watched: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0

export type ReviewKind = 'idle' | 'never' | 'late' | 'soon' | 'ok'
export interface ReviewStatus { kind: ReviewKind; label: string }

/**
 * Situação da revisão espaçada: cada matéria tem um intervalo (dias). Passou do intervalo = atrasada;
 * faltando até 2 dias = “revisar em breve”. Sem aulas assistidas ainda não há o que revisar.
 */
export function reviewStatus(s: Pick<Subject, 'watched_lessons' | 'last_reviewed_on' | 'review_every_days'>, today: string): ReviewStatus {
  if (s.watched_lessons <= 0) return { kind: 'idle', label: 'Sem aulas ainda' }
  if (!s.last_reviewed_on) return { kind: 'never', label: 'Nunca revisada' }
  const over = daysBetween(s.last_reviewed_on, today) - s.review_every_days
  if (over > 0) return { kind: 'late', label: `Atrasada há ${over} ${over === 1 ? 'dia' : 'dias'}` }
  if (over === 0) return { kind: 'soon', label: 'Revisar hoje' }
  if (over >= -2) return { kind: 'soon', label: `Revisar em ${-over} ${-over === 1 ? 'dia' : 'dias'}` }
  return { kind: 'ok', label: `Em dia, próxima em ${-over} dias` }
}

export const sumMinutes = (logs: StudyLog[]) => logs.reduce((n, l) => n + l.minutes, 0)

/** Minutos estudados em cada dia da lista. */
export function minutesByDay(logs: StudyLog[], days: string[]): number[] {
  const m = new Map<string, number>()
  for (const l of logs) m.set(l.studied_on, (m.get(l.studied_on) ?? 0) + l.minutes)
  return days.map((d) => m.get(d) ?? 0)
}

/** Minutos por matéria dentro de um conjunto de dias (matérias apagadas caem em `null`). */
export function minutesBySubject(logs: StudyLog[], days: string[]): Map<string | null, number> {
  const set = new Set(days)
  const out = new Map<string | null, number>()
  for (const l of logs) if (set.has(l.studied_on)) out.set(l.subject_id, (out.get(l.subject_id) ?? 0) + l.minutes)
  return out
}

/** Dias seguidos com estudo registrado. Se hoje ainda não teve, a sequência de ontem continua valendo. */
export function streak(logs: StudyLog[], today: string): number {
  const days = new Set(logs.filter((l) => l.minutes > 0).map((l) => l.studied_on))
  let d = parseYmd(today)
  if (!days.has(ymd(d))) d = addDays(d, -1)
  let n = 0
  while (days.has(ymd(d))) { n++; d = addDays(d, -1) }
  return n
}

export const blocksOfDay = (blocks: Block[], weekday: number) =>
  blocks.filter((b) => b.weekday === weekday).sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))

/** Um bloco está “feito” numa data quando há registro de estudo ligado a ele naquele dia. */
export const blockMinutesDone = (block: Block, date: string, logs: StudyLog[]) =>
  logs.filter((l) => l.block_id === block.id && l.studied_on === date).reduce((n, l) => n + l.minutes, 0)

export interface NowPointer { current: string | null; next: string | null }
/** Qual bloco do dia está rolando agora e qual é o próximo (ignora os já concluídos). */
export function nowPointer<T extends { id: string; start_time: string; minutes: number }>(blocks: T[], nowMin: number, isDone: (b: T) => boolean): NowPointer {
  let current: string | null = null, next: string | null = null
  for (const b of blocks) {
    if (isDone(b)) continue
    const start = toMinutes(b.start_time)
    if (nowMin >= start && nowMin < start + b.minutes) current = b.id
    else if (start > nowMin && !next) next = b.id
  }
  return { current, next }
}

/** Tarefas que precisam de atenção hoje: urgentes ou vencendo até hoje (as atrasadas primeiro). */
export function urgentTasks(tasks: Task[], today: string): Task[] {
  const rank = (t: Task) => (t.due_on && t.due_on < today ? 0 : t.due_on === today ? 1 : 2)
  return tasks
    .filter((t) => !t.done && (t.urgent || (t.due_on !== null && t.due_on <= today)))
    .sort((a, b) => rank(a) - rank(b) || (a.due_on ?? '9').localeCompare(b.due_on ?? '9'))
}

export const QUOTES = [
  'Constância vence intensidade. Uma hora todo dia ganha de dez horas no domingo.',
  'Você não precisa estar motivado para começar. Começar é o que traz a motivação.',
  'Quem aprende em público erra em público, e é por isso que aprende rápido.',
  'Revisar é estudar de novo, só que mais barato. Faça isso antes de esquecer.',
  'Uma certificação é a prova de um hábito, não de uma noite de maratona.',
  'Falar mal inglês hoje é o caminho para falar bem em seis meses.',
  'Deixe a próxima sessão tão fácil de começar que não dê para negociar.',
  'Pequenas sessões todos os dias constroem o que grandes planos só prometem.',
  'Laboratório vale mais que vídeo: abra o portal e quebre alguma coisa de propósito.',
  'O que você estuda em casa hoje é o salário que você negocia amanhã.',
]

/** Frase sugerida para a semana: muda toda segunda-feira, de forma determinística. */
export function quoteOfWeek(d: Date): string {
  const { year, week } = isoWeek(d)
  return QUOTES[(year * 53 + week) % QUOTES.length]
}

export const GOAL_YEAR = 2027
export type YearProgress = { kind: 'before'; days: number } | { kind: 'during'; day: number; of: number } | null

/** Contagem para o ano-alvo: dias que faltam antes dele e “dia N de 365” durante ele. */
export function yearProgress(today: string, year = GOAL_YEAR): YearProgress {
  const start = `${year}-01-01`, end = `${year}-12-31`
  if (today < start) return { kind: 'before', days: daysBetween(today, start) }
  if (today <= end) return { kind: 'during', day: daysBetween(start, today) + 1, of: daysBetween(start, end) + 1 }
  return null
}

/** Matérias e blocos sugeridos para começar o plano do ano: Inglês + Azure. Tudo editável depois. */
export const STARTER_PLAN = {
  subjects: [
    { key: 'ingles', name: 'Inglês', area: 'Idiomas', color: '#b0566b', weekly_goal_min: 300, review_every_days: 7, priority: true },
    { key: 'azure', name: 'Azure', area: 'Certificação', color: '#4a7ab8', weekly_goal_min: 360, review_every_days: 14, priority: true },
  ],
  // weekday: 0 = segunda … 6 = domingo
  blocks: [
    { key: 'azure', weekday: 0, start_time: '19:00', minutes: 60 },
    { key: 'ingles', weekday: 1, start_time: '19:00', minutes: 60 },
    { key: 'azure', weekday: 2, start_time: '19:00', minutes: 60 },
    { key: 'ingles', weekday: 3, start_time: '19:00', minutes: 60 },
    { key: 'azure', weekday: 4, start_time: '19:00', minutes: 60 },
    { key: 'ingles', weekday: 5, start_time: '09:00', minutes: 90 },
    { key: 'azure', weekday: 5, start_time: '10:45', minutes: 120 },
    { key: 'ingles', weekday: 6, start_time: '10:00', minutes: 60 },
  ],
}

/** Prova-alvo: dias que faltam (0 = é hoje). `null` se não há prova ou ela já passou. */
export function daysToExam(today: string, examDate: string | null): number | null {
  if (!examDate) return null
  const d = daysBetween(today, examDate)
  return d >= 0 ? d : null
}
