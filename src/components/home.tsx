'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Pause, Play, Plus, RotateCcw, Square } from 'lucide-react'
import { Dot, subjectColor, subjectName } from '@/components/ui'
import type { ReadyApp } from '@/contexts/app'
import { WEEKDAYS_SHORT, daysBetween, fmtDuration, hhmm, parseYmd, shortDay, weekDays, weekdayIndex } from '@/lib/dates'
import { GOAL_YEAR, blockMinutesDone, blocksOfDay, minutesByDay, minutesBySubject, nowPointer, progressPct, sumMinutes, urgentTasks, yearProgress } from '@/lib/study'
import { elapsedMs, fmtClock, isFinished, minutesToLog, remainingMs, timerFraction } from '@/lib/timer'
import type { Block, Task } from '@/lib/types'

/** Tudo o que a Home precisa saber sobre o dia: blocos, o que já foi feito e qual é o atual/próximo. */
export function todayPlan(app: ReadyApp) {
  const { study, today, date, nowMin } = app
  const blocks = blocksOfDay(study.blocks.rows, weekdayIndex(date))
  const doneMin = (b: Block) => blockMinutesDone(b, today, study.logs.rows)
  const pointer = nowPointer(blocks, nowMin, (b) => doneMin(b) > 0)
  const suggested = blocks.find((b) => b.id === (pointer.current ?? pointer.next)) ?? null
  return {
    blocks, doneMin, pointer, suggested, isNow: suggested !== null && suggested.id === pointer.current,
    planned: blocks.reduce((n, b) => n + b.minutes, 0),
    studied: sumMinutes(study.logs.rows.filter((l) => l.studied_on === today)),
  }
}
export type TodayPlan = ReturnType<typeof todayPlan>

export const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function PanelTitle({ id, title, aside }: { id: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-3">
      <h2 id={id} className="font-display text-xl font-medium">{title}</h2>
      {aside}
    </div>
  )
}

/* ───────────────────────── Foco ───────────────────────── */
export function FocusCard({ app, plan }: { app: ReadyApp; plan: TodayPlan }) {
  const { study, timer: api, now, today } = app
  const t = api.timer
  const idle = t.status === 'idle'
  const running = t.status === 'running'
  const finished = isFinished(t, now)
  const { suggested } = plan
  const [custom, setCustom] = useState(false)
  const showCustom = idle && (custom || !suggested)

  const subjectId = idle ? (showCustom ? t.subjectId : suggested?.subject_id ?? null) : t.subjectId
  const subject = study.subjects.rows.find((s) => s.id === subjectId)
  const minutes = idle ? (showCustom || !suggested ? t.durationMin : suggested.minutes) : t.durationMin
  const clock = idle ? fmtClock(minutes * 60_000) : fmtClock(remainingMs(t, now))
  const block = !idle ? plan.blocks.find((b) => b.id === t.blockId) : showCustom ? null : suggested

  async function log() {
    const row = await study.logs.insert({ subject_id: t.subjectId, block_id: t.blockId, studied_on: today, minutes: minutesToLog(t, Date.now()) }, 'registrar a sessão')
    if (row) api.reset()
  }

  const status = !idle
    ? finished ? 'Tempo encerrado' : running ? 'Em andamento' : 'Pausado'
    : suggested && !showCustom ? (plan.isNow ? 'Agora' : `Próximo bloco, ${hhmm(suggested.start_time)}`) : 'Sessão livre'

  return (
    <section aria-labelledby="foco" className="sheet p-6 md:p-8">
      <PanelTitle id="foco" title="Foco" aside={<span className="text-sm text-ink2">{status}</span>} />

      <p className="tnum font-display text-[5rem] font-light leading-none tracking-tight md:text-[6.5rem]" role="timer" aria-label={`${idle ? 'Duração' : 'Faltam'} ${clock}`}>{clock}</p>
      <div className="mt-5 h-0.5 bg-rule" aria-hidden><div className="h-full bg-accent" style={{ width: `${(idle ? 0 : timerFraction(t, now)) * 100}%`, transition: 'width 1s linear' }} /></div>

      <p className="mt-5 flex min-h-7 items-center gap-2.5 text-lg font-medium">
        {subject ? <><Dot color={subject.color} size={9} />{subject.name}</> : <span className="text-ink2">Sem matéria</span>}
      </p>
      <p className="min-h-5 text-sm text-ink2">{block?.title ?? (block ? `${fmtDuration(block.minutes)} planejados` : '')}</p>

      {showCustom && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="seg" role="group" aria-label="Duração">
            {[25, 50, 90].map((m) => <button key={m} aria-pressed={t.durationMin === m} onClick={() => api.configure({ durationMin: m })}>{m} min</button>)}
          </div>
          <label className="sr-only" htmlFor="foco-materia">Matéria</label>
          <select id="foco-materia" className="input !w-auto" value={t.subjectId ?? ''} onChange={(e) => api.configure({ subjectId: e.target.value || null })}>
            <option value="">Sem matéria</option>
            {study.subjects.rows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {idle && (suggested && !showCustom
          ? <button className="btn" onClick={() => api.begin({ durationMin: suggested.minutes, subjectId: suggested.subject_id, blockId: suggested.id })}><Play size={15} aria-hidden /> Iniciar {fmtDuration(suggested.minutes)}</button>
          : <button className="btn" onClick={api.start}><Play size={15} aria-hidden /> Iniciar {fmtDuration(t.durationMin)}</button>)}
        {running && !finished && <button className="btn" onClick={api.pause}><Pause size={15} aria-hidden /> Pausar</button>}
        {t.status === 'paused' && !finished && <button className="btn" onClick={api.start}><Play size={15} aria-hidden /> Retomar</button>}
        {!idle && (
          <button className={finished ? 'btn' : 'btn-ghost'} onClick={log} disabled={elapsedMs(t, now) < 1000}>
            <Square size={12} aria-hidden /> Registrar {fmtDuration(minutesToLog(t, now))}
          </button>
        )}
        {!idle && <button className="btn-quiet" onClick={api.reset}><RotateCcw size={14} aria-hidden /> Descartar</button>}
        {idle && suggested && <button className="btn-quiet" onClick={() => setCustom((c) => !c)}>{custom ? 'Voltar ao bloco planejado' : 'Outra matéria ou duração'}</button>}
      </div>
    </section>
  )
}

/* ───────────────────────── Hoje ───────────────────────── */
function dueLabel(t: Task, today: string): string | null {
  if (!t.due_on) return null
  const d = daysBetween(today, t.due_on)
  if (d < 0) return `Atrasada há ${-d} ${d === -1 ? 'dia' : 'dias'}`
  if (d === 0) return 'Vence hoje'
  if (d === 1) return 'Vence amanhã'
  return `Vence em ${shortDay(parseYmd(t.due_on))}`
}

const box = 'grid shrink-0 place-items-center border border-ink3 text-transparent transition-colors hover:border-ink hover:text-ink3'

export function PlanCard({ app, plan }: { app: ReadyApp; plan: TodayPlan }) {
  const { study, today, timer, open } = app
  const { subjects, logs, tasks } = study
  const todayLogs = logs.rows.filter((l) => l.studied_on === today)
  const urgent = urgentTasks(tasks.rows, today)
  const shown = urgent.slice(0, 4)

  const complete = (b: Block) => logs.insert({ subject_id: b.subject_id, block_id: b.id, studied_on: today, minutes: b.minutes }, 'registrar o bloco')
  const undo = async (b: Block) => { for (const l of todayLogs.filter((x) => x.block_id === b.id)) await logs.remove(l.id, 'desfazer o registro') }

  return (
    <section aria-labelledby="hoje" className="sheet flex flex-col p-6 md:p-8">
      <PanelTitle id="hoje" title="Hoje" aside={plan.planned > 0 ? <p className="tnum text-sm text-ink2">{fmtDuration(plan.studied)} de {fmtDuration(plan.planned)}</p> : undefined} />

      {plan.blocks.length === 0 ? (
        <p className="text-sm text-ink2">
          Nenhum bloco para hoje.
          <button className="btn-quiet ml-1 !px-1.5 underline" onClick={() => open({ k: 'block', weekday: weekdayIndex(app.date) })}>Criar um bloco</button>
        </p>
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {plan.blocks.map((b) => {
            const done = plan.doneMin(b) > 0
            const isNow = plan.pointer.current === b.id
            const name = subjectName(subjects.rows, b.subject_id) ?? b.title ?? 'Bloco livre'
            const busy = timer.timer.status !== 'idle'
            return (
              <li key={b.id} className="group flex items-center gap-3 py-3">
                <button role="checkbox" aria-checked={done} onClick={() => (done ? undo(b) : complete(b))} aria-label={`${done ? 'Desfazer' : 'Marcar como feito'}: ${name}`}
                  className={`${box} size-5 rounded ${done ? '!border-ok !bg-ok !text-paper' : ''}`}><Check size={13} strokeWidth={3} aria-hidden /></button>
                <span className="tnum w-11 shrink-0 text-sm text-ink2">{hhmm(b.start_time)}</span>
                <Dot color={subjectColor(subjects.rows, b.subject_id)} size={8} />
                <span className={`min-w-0 flex-1 truncate ${done ? 'text-ink3 line-through' : 'font-medium'}`}>{name}</span>
                {isNow && !done && <span className="now">Agora</span>}
                <span className="tnum shrink-0 text-sm text-ink2">{fmtDuration(b.minutes)}</span>
                {!done && !busy && (
                  <button className="btn-quiet !px-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    onClick={() => timer.begin({ durationMin: b.minutes, subjectId: b.subject_id, blockId: b.id })} aria-label={`Iniciar o foco: ${name}`}><Play size={13} aria-hidden /></button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="mb-2 mt-7 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-medium">Pendências</h3>
        <button className="btn-quiet -mr-2.5" onClick={() => open({ k: 'task' })}><Plus size={14} aria-hidden /> Tarefa</button>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-ink2">Nada urgente por agora.</p>
      ) : (
        <ul className="space-y-0.5">
          {shown.map((t) => {
            const due = dueLabel(t, today)
            const late = !!t.due_on && t.due_on < today
            return (
              <li key={t.id} className="flex items-start gap-3 py-1.5">
                <button role="checkbox" aria-checked="false" onClick={() => tasks.patch(t.id, { done: true }, 'concluir a tarefa')} aria-label={`Concluir: ${t.title}`}
                  className={`${box} mt-0.5 size-[18px] rounded-[3px]`}><Check size={12} strokeWidth={3} aria-hidden /></button>
                <button className="min-w-0 flex-1 text-left" onClick={() => open({ k: 'task', item: t })}>
                  <span className="block truncate text-[15px]">{t.title}</span>
                  {due && <span className={`block text-xs ${late ? 'font-semibold text-bad' : 'text-ink2'}`}>{due}</span>}
                </button>
              </li>
            )
          })}
          {urgent.length > shown.length && <li className="pt-1 text-xs text-ink3">e mais {urgent.length - shown.length}</li>}
        </ul>
      )}
    </section>
  )
}

/* ───────────────────────── Semana ───────────────────────── */
export function WeekStrip({ app }: { app: ReadyApp }) {
  const { study, today, date } = app
  const days = weekDays(date)
  const done = minutesByDay(study.logs.rows, days)
  const planned = days.map((_, i) => blocksOfDay(study.blocks.rows, i).reduce((n, b) => n + b.minutes, 0))
  const totalPlanned = planned.reduce((a, b) => a + b, 0)
  const totalDone = done.reduce((a, b) => a + b, 0)

  return (
    <section aria-labelledby="semana-mini" className="sheet p-6 md:p-8">
      <PanelTitle id="semana-mini" title="Semana" aside={<Link href="/semana" className="btn-quiet -mr-2.5">Detalhes <ChevronRight size={14} aria-hidden /></Link>} />
      <ol className="grid grid-cols-7">
        {days.map((day, i) => {
          const isToday = day === today
          const frac = planned[i] ? Math.min(1, done[i] / planned[i]) : 0
          return (
            <li key={day} className={`px-2 first:pl-0 last:pr-0 ${i > 0 ? 'border-l border-rule' : ''}`} aria-current={isToday ? 'date' : undefined}>
              <p className={`text-xs ${isToday ? 'font-semibold text-accent' : 'text-ink2'}`}>{WEEKDAYS_SHORT[i]}</p>
              <p className={`tnum font-display text-2xl leading-tight ${isToday ? 'font-semibold text-accent' : ''}`}>{parseYmd(day).getDate()}</p>
              <div className="mt-2 h-0.5 bg-rule" aria-hidden><div className="h-full bg-accent" style={{ width: `${frac * 100}%` }} /></div>
              <p className="tnum mt-1.5 text-xs text-ink2">{planned[i] ? fmtDuration(planned[i]) : '—'}</p>
            </li>
          )
        })}
      </ol>
      <p className="mt-6 text-sm text-ink2">
        {totalPlanned ? <><span className="tnum font-semibold text-ink">{fmtDuration(totalDone)}</span> de {fmtDuration(totalPlanned)} planejadas nesta semana.</> : 'Sem blocos planejados nesta semana.'}
      </p>
    </section>
  )
}

/* ───────────────────────── Rumo ao ano-alvo ───────────────────────── */
export function GoalsCard({ app }: { app: ReadyApp }) {
  const { study, today, date } = app
  const year = yearProgress(today)
  const bySubject = minutesBySubject(study.logs.rows, weekDays(date))
  const list = [...study.subjects.rows].sort((a, b) => Number(b.priority) - Number(a.priority) || a.name.localeCompare(b.name, 'pt-BR')).slice(0, 3)

  return (
    <section aria-labelledby="rumo" className="sheet p-6 md:p-8">
      <PanelTitle id="rumo" title={`Rumo a ${GOAL_YEAR}`} aside={year ? <span className="chip tnum">{year.kind === 'before' ? `${year.days} ${year.days === 1 ? 'dia' : 'dias'}` : `Dia ${year.day} de ${year.of}`}</span> : undefined} />
      {list.length === 0 ? (
        <p className="text-sm text-ink2">Cadastre suas matérias para acompanhar o progresso aqui.</p>
      ) : (
        <ul className="space-y-5">
          {list.map((s) => {
            const pct = progressPct(s.watched_lessons, s.total_lessons)
            const week = bySubject.get(s.id) ?? 0
            return (
              <li key={s.id}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2.5 font-medium"><Dot color={s.color} size={8} />{s.name}</span>
                  <span className="tnum font-display text-lg">{s.total_lessons ? `${pct}%` : ''}</span>
                </div>
                <div className="h-1 bg-rule" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name}: ${pct}% das aulas`}>
                  <div className="h-full" style={{ width: `${pct}%`, background: s.color, transition: 'width .4s' }} />
                </div>
                <p className="tnum mt-1.5 text-xs text-ink2">
                  {s.total_lessons ? `${s.watched_lessons} de ${s.total_lessons} aulas` : 'Sem total de aulas'}
                  {s.weekly_goal_min > 0 && `. Semana: ${fmtDuration(week)} de ${fmtDuration(s.weekly_goal_min)}`}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
