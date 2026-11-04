export interface Subject {
  id: string
  name: string
  area: string | null
  color: string
  total_lessons: number
  watched_lessons: number
  weekly_goal_min: number
  review_every_days: number
  last_reviewed_on: string | null
  priority: boolean
}

export interface Task {
  id: string
  title: string
  subject_id: string | null
  due_on: string | null
  urgent: boolean
  done: boolean
}

/** Bloco fixo da semana: se repete toda semana no mesmo dia e horário. */
export interface Block {
  id: string
  weekday: number // 0 = segunda … 6 = domingo
  start_time: string // 'HH:MM:SS'
  minutes: number
  subject_id: string | null
  title: string | null
}

export interface StudyLog {
  id: string
  subject_id: string | null
  block_id: string | null
  plan_session_id?: string | null
  studied_on: string
  minutes: number
  note: string | null
}

export const LINK_KINDS = ['pdf', 'livro', 'curso', 'video', 'link'] as const
export type LinkKind = (typeof LINK_KINDS)[number]
export const LINK_LABEL: Record<LinkKind, string> = { pdf: 'PDF', livro: 'Livro', curso: 'Curso', video: 'Vídeo', link: 'Link' }

/** Sessão com data do cronograma (ex.: plano de um concurso). */
export interface PlanSession {
  id: string
  subject_id: string | null
  planned_on: string
  start_time: string // 'HH:MM:SS'
  minutes: number
  topic: string
  done: boolean
}

export interface LinkItem {
  id: string
  title: string
  url: string | null
  kind: LinkKind
  subject_id: string | null
  note: string | null
}

export interface Settings {
  weekly_goal_min: number
  quote: string | null
  quote_week: string | null
  exam_name: string | null
  exam_date: string | null
}
export const DEFAULT_SETTINGS: Settings = { weekly_goal_min: 600, quote: null, quote_week: null, exam_name: null, exam_date: null }
