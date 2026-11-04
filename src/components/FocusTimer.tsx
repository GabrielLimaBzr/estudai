'use client'
import { useEffect } from 'react'
import { Pause, Play, Plus, RotateCcw, Square } from 'lucide-react'
import type { OpenDialog } from '@/components/dialogs'
import type { Study } from '@/hooks/useStudy'
import type { TimerApi } from '@/hooks/useTimer'
import { fmtDuration } from '@/lib/dates'
import { sumMinutes } from '@/lib/study'
import { elapsedMs, fmtClock, isFinished, minutesToLog, remainingMs, timerFraction } from '@/lib/timer'

const PRESETS = [25, 50, 90]

export function FocusTimer({ study, today, now, api, open }: { study: Study; today: string; now: number; api: TimerApi; open: OpenDialog }) {
  const { timer: t } = api
  const idle = t.status === 'idle'
  const running = t.status === 'running'
  const finished = isFinished(t, now)
  const studiedToday = sumMinutes(study.logs.rows.filter((l) => l.studied_on === today))

  // ao chegar em zero o cronômetro congela (não registra sozinho: quem decide é você)
  useEffect(() => { if (running && finished) api.pause() }, [running, finished, api])

  // o tempo restante aparece na aba do navegador, para acompanhar de outra janela
  useEffect(() => {
    if (idle) return
    document.title = finished ? 'Tempo! · EstudAI' : `${fmtClock(remainingMs(t, now))} · EstudAI`
    return () => { document.title = 'EstudAI' }
  })

  async function log() {
    const minutes = minutesToLog(t, Date.now())
    const row = await study.logs.insert({ subject_id: t.subjectId, block_id: t.blockId, studied_on: today, minutes }, 'registrar a sessão')
    if (row) api.reset()
  }

  const frac = timerFraction(t, now)
  return (
    <section aria-labelledby="foco" className={`flex h-full flex-col rounded-[28px] border p-5 transition-colors md:p-7 ${running ? 'now border-transparent' : 'border-rule bg-sheet'}`} style={{ boxShadow: running ? undefined : 'var(--shadow-sheet)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="foco" className="text-2xl font-semibold leading-tight">Foco</h2>
          <p className={`mt-0.5 text-sm ${running ? 'muted' : 'text-ink2'}`}>
            {idle ? 'Escolha a matéria, comece e só pare no fim.' : finished ? 'Tempo! Registre a sessão.' : running ? 'Em andamento. Uma coisa só.' : 'Pausado.'}
          </p>
        </div>
        {idle && (
          <div className="seg" role="group" aria-label="Duração">
            {PRESETS.map((m) => <button key={m} aria-pressed={t.durationMin === m} onClick={() => api.configure({ durationMin: m })}>{m}</button>)}
          </div>
        )}
      </div>

      <p className="tnum my-6 text-center font-display text-[5.5rem] font-semibold leading-none tracking-tight md:text-[7rem]" role="timer" aria-live="off" aria-label={`Faltam ${fmtClock(remainingMs(t, now))}`}>
        {fmtClock(idle ? t.durationMin * 60_000 : remainingMs(t, now))}
      </p>

      <div className={`mb-5 h-1.5 overflow-hidden rounded-full ${running ? 'bg-on-marker/20' : 'bg-sunk'}`} aria-hidden>
        <div className={`h-full rounded-full ${running ? 'bg-on-marker' : 'bg-ink'}`} style={{ width: `${frac * 100}%`, transition: 'width 1s linear' }} />
      </div>

      <div className="mb-4">
        <label className={`mb-1 block text-sm font-medium ${running ? 'muted' : 'text-ink2'}`} htmlFor="foco-materia">Matéria</label>
        <div className={running ? '[&_select]:border-on-marker/30 [&_select]:bg-transparent [&_select]:text-on-marker' : ''}>
          <select id="foco-materia" className="input" value={t.subjectId ?? ''} disabled={!idle} onChange={(e) => api.configure({ subjectId: e.target.value || null })}>
            <option value="">Sem matéria</option>
            {study.subjects.rows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {idle && <button className="btn flex-1" onClick={api.start}><Play size={16} aria-hidden /> Começar {fmtDuration(t.durationMin)}</button>}
        {running && !finished && <button className="btn flex-1" onClick={api.pause}><Pause size={16} aria-hidden /> Pausar</button>}
        {t.status === 'paused' && !finished && <button className="btn flex-1" onClick={api.start}><Play size={16} aria-hidden /> Retomar</button>}
        {!idle && (
          <button className={finished ? 'btn flex-1' : 'btn-ghost'} onClick={log} disabled={elapsedMs(t, now) < 1000}>
            <Square size={14} aria-hidden /> {finished ? `Registrar ${fmtDuration(minutesToLog(t, now))}` : `Encerrar e registrar ${fmtDuration(minutesToLog(t, now))}`}
          </button>
        )}
        {!idle && <button className="btn-quiet" onClick={api.reset} aria-label="Descartar sessão"><RotateCcw size={15} aria-hidden /> Descartar</button>}
      </div>

      <div className={`mt-4 flex items-center justify-between gap-2 border-t pt-3 text-sm ${running ? 'border-on-marker/20' : 'border-rule'}`}>
        <span className={running ? 'muted' : 'text-ink2'}>Hoje: <b className="tnum text-[inherit] font-semibold" style={{ color: running ? 'inherit' : 'var(--ink)' }}>{fmtDuration(studiedToday)}</b> estudadas</span>
        <button className="btn-quiet" onClick={() => open({ k: 'log', subject: t.subjectId })}><Plus size={15} aria-hidden /> Registrar manualmente</button>
      </div>
    </section>
  )
}
