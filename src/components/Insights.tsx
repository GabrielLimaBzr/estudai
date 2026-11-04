'use client'
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Dot, PageHeader, hoursToMinutes, minutesToHours } from '@/components/ui'
import type { ReadyApp } from '@/contexts/app'
import { WEEKDAYS_SHORT, fmtDuration, weekDays, weekKey } from '@/lib/dates'
import { minutesByDay, minutesBySubject, quoteOfWeek, streak, sumMinutes } from '@/lib/study'

export function Insights({ app }: { app: ReadyApp }) {
  const { study, today, date } = app
  const { settings, subjects, logs } = study
  const wk = weekKey(date)
  const custom = settings.quote && settings.quote_week === wk ? settings.quote : null
  const quote = custom ?? quoteOfWeek(date)

  const days = weekDays(date)
  const perDay = minutesByDay(logs.rows, days)
  const weekTotal = perDay.reduce((a, b) => a + b, 0)
  const goal = settings.weekly_goal_min
  const dailyTarget = goal / 7
  const scale = Math.max(...perDay, dailyTarget, 60)
  const bySubject = minutesBySubject(logs.rows, days)
  const withGoal = subjects.rows.filter((s) => s.weekly_goal_min > 0)
  const monthTotal = sumMinutes(logs.rows.filter((l) => l.studied_on.startsWith(today.slice(0, 7))))
  const allTotal = sumMinutes(logs.rows)
  const run = streak(logs.rows, today)

  const [editQuote, setEditQuote] = useState(false)
  const [draft, setDraft] = useState('')
  const [editGoal, setEditGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')

  async function saveQuote(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (await study.saveSettings({ quote: text || null, quote_week: text ? wk : null })) setEditQuote(false)
  }
  async function saveGoal(e: React.FormEvent) {
    e.preventDefault()
    if (await study.saveSettings({ weekly_goal_min: hoursToMinutes(goalDraft) })) setEditGoal(false)
  }

  return (
    <>
      <PageHeader title="Metas" summary="Horas reais de estudo, sem enfeite." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section aria-labelledby="horas" className="sheet p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="horas" className="font-sans text-sm font-medium text-ink2">Horas da semana</h2>
              <p className="tnum mt-2 font-display text-6xl font-light leading-none">{fmtDuration(weekTotal)}</p>
            </div>
            {editGoal ? (
              <form onSubmit={saveGoal} className="flex items-center gap-2">
                <label className="text-sm text-ink2" htmlFor="meta">Meta (horas)</label>
                <input id="meta" className="input tnum !w-20" inputMode="decimal" value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} autoFocus />
                <button className="btn !min-h-10" type="submit">OK</button>
              </form>
            ) : (
              <button className="btn-quiet" onClick={() => { setGoalDraft(minutesToHours(goal)); setEditGoal(true) }}>Meta {goal ? fmtDuration(goal) : 'não definida'} <Pencil size={13} aria-hidden /></button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-7 items-end gap-3" role="img" aria-label={`Minutos por dia: ${WEEKDAYS_SHORT.map((d, i) => `${d} ${perDay[i]}`).join(', ')}.`}>
            {perDay.map((m, i) => {
              const isToday = days[i] === today
              return (
                <div key={days[i]} className="flex flex-col items-center gap-2">
                  <span className="tnum h-4 text-xs text-ink2">{m ? fmtDuration(m) : ''}</span>
                  <div className="relative flex h-32 w-full items-end">
                    {goal > 0 && <div className="absolute inset-x-0 border-t border-dashed border-ink3/60" style={{ bottom: `${(dailyTarget / scale) * 100}%` }} aria-hidden />}
                    <div className={`mx-auto w-3 rounded-t-[2px] md:w-5 ${isToday ? 'bg-accent' : 'bg-ink3'}`} style={{ height: `${(m / scale) * 100}%`, minHeight: m ? 4 : 0 }} />
                  </div>
                  <span className={`text-xs ${isToday ? 'font-semibold' : 'text-ink3'}`}>{WEEKDAYS_SHORT[i]}</span>
                </div>
              )
            })}
          </div>
          {goal > 0 && <p className="mt-4 text-xs text-ink3">A linha tracejada é a média diária para chegar a {fmtDuration(goal)} no fim da semana.</p>}

          {withGoal.length > 0 && (
            <ul className="mt-8 space-y-5 border-t border-rule pt-6">
              {withGoal.map((s) => {
                const m = bySubject.get(s.id) ?? 0
                const pct = Math.min(100, Math.round((m / s.weekly_goal_min) * 100))
                return (
                  <li key={s.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium"><Dot color={s.color} />{s.name}</span>
                      <span className="tnum text-ink2">{fmtDuration(m)} de {fmtDuration(s.weekly_goal_min)}</span>
                    </div>
                    <div className="h-1 bg-rule" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name}: ${pct}% da meta semanal`}>
                      <div className="h-full" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="numeros" className="sheet grid grid-cols-3 gap-4 p-6 md:p-8">
            <h2 id="numeros" className="sr-only">Seus números</h2>
            {[
              { k: 'Sequência', v: `${run} ${run === 1 ? 'dia' : 'dias'}` },
              { k: 'No mês', v: fmtDuration(monthTotal) },
              { k: 'No total', v: fmtDuration(allTotal) },
            ].map((x) => (
              <div key={x.k}><p className="tnum font-display text-2xl md:text-3xl">{x.v}</p><p className="mt-1 text-sm text-ink2">{x.k}</p></div>
            ))}
          </section>

          <section aria-labelledby="frase" className="sheet flex flex-1 flex-col p-6 md:p-8">
            <h2 id="frase" className="font-sans text-sm font-medium text-ink2">Frase da semana</h2>
            {editQuote ? (
              <form onSubmit={saveQuote} className="mt-4 space-y-3">
                <label className="sr-only" htmlFor="frase-texto">Frase da semana</label>
                <textarea id="frase-texto" className="input min-h-32" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={240} autoFocus />
                <div className="flex gap-2"><button className="btn" type="submit">Salvar frase</button><button className="btn-ghost" type="button" onClick={() => setEditQuote(false)}>Cancelar</button></div>
              </form>
            ) : (
              <>
                <blockquote className="mt-4 font-display text-2xl font-normal leading-snug md:text-[1.7rem]">“{quote}”</blockquote>
                <div className="mt-auto flex flex-wrap gap-1 pt-6">
                  <button className="btn-quiet -ml-3" onClick={() => { setDraft(quote); setEditQuote(true) }}><Pencil size={14} aria-hidden /> Escrever a minha</button>
                  {custom && <button className="btn-quiet" onClick={() => study.saveSettings({ quote: null, quote_week: null })}>Voltar à sugerida</button>}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
