'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IDLE_TIMER, pause as pauseT, start as startT, type TimerState } from '@/lib/timer'

const KEY = 'estudai:timer'

/** Estado do cronômetro de foco, guardado no navegador (sobrevive a recarregar a página). */
export function useTimer() {
  const [timer, setTimer] = useState<TimerState>(IDLE_TIMER)
  const loaded = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const t = JSON.parse(raw) as TimerState
        if (t && ['idle', 'running', 'paused'].includes(t.status) && t.durationMin > 0) setTimer(t)
      }
    } catch { /* sem storage */ }
    loaded.current = true
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    try { localStorage.setItem(KEY, JSON.stringify(timer)) } catch { /* sem storage */ }
  }, [timer])

  const configure = useCallback((c: Partial<TimerState>) => setTimer((t) => ({ ...t, ...c })), [])
  const start = useCallback(() => setTimer((t) => startT(t, Date.now())), [])
  const pause = useCallback(() => setTimer((t) => pauseT(t, Date.now())), [])
  const reset = useCallback(() => setTimer((t) => ({ ...IDLE_TIMER, durationMin: t.durationMin, subjectId: t.subjectId })), [])
  /** Prepara e inicia uma sessão (usado pelo botão “Iniciar” de um bloco). */
  const begin = useCallback((c: { durationMin: number; subjectId: string | null; blockId: string | null; sessionId?: string | null }) =>
    setTimer({ ...IDLE_TIMER, ...c, status: 'running', startedAt: Date.now() }), [])

  return { timer, configure, start, pause, reset, begin }
}
export type TimerApi = ReturnType<typeof useTimer>
