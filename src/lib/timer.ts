/** Cronômetro de foco. Guarda instantes (não contagem), então sobrevive a recarregar a página e a abas em segundo plano. */
export interface TimerState {
  status: 'idle' | 'running' | 'paused'
  durationMin: number
  startedAt: number // ms; só vale quando running
  elapsedMs: number // acumulado antes do último início
  subjectId: string | null
  blockId: string | null
  sessionId?: string | null // sessão do cronograma em andamento
}

export const IDLE_TIMER: TimerState = { status: 'idle', durationMin: 50, startedAt: 0, elapsedMs: 0, subjectId: null, blockId: null }

export const elapsedMs = (t: TimerState, now: number) => t.elapsedMs + (t.status === 'running' ? Math.max(0, now - t.startedAt) : 0)
export const remainingMs = (t: TimerState, now: number) => Math.max(0, t.durationMin * 60_000 - elapsedMs(t, now))
export const isFinished = (t: TimerState, now: number) => t.status !== 'idle' && remainingMs(t, now) === 0
/** 0–1 do tempo já usado. */
export const timerFraction = (t: TimerState, now: number) => (t.durationMin > 0 ? Math.min(1, elapsedMs(t, now) / (t.durationMin * 60_000)) : 0)

/** Minutos a registrar ao encerrar: o tempo corrido (arredondado), no mínimo 1 e no máximo a duração. */
export const minutesToLog = (t: TimerState, now: number) => Math.max(1, Math.min(t.durationMin, Math.round(elapsedMs(t, now) / 60_000)))

/** 'mm:ss' (ou 'h:mm:ss' a partir de 1h) do tempo que falta (arredonda segundos para cima, para não mostrar 00:00 antes da hora). */
export function fmtClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export const start = (t: TimerState, now: number): TimerState => ({ ...t, status: 'running', startedAt: now })
export const pause = (t: TimerState, now: number): TimerState => ({ ...t, status: 'paused', elapsedMs: elapsedMs(t, now), startedAt: 0 })
