'use client'
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Dot, hoursToMinutes, minutesToHours } from '@/components/ui'
import type { Study } from '@/hooks/useStudy'
import { WEEKDAYS_SHORT, fmtDuration, parseYmd, weekDays, weekKey } from '@/lib/dates'
import { minutesByDay, minutesBySubject, quoteOfWeek, streak, sumMinutes } from '@/lib/study'

export function Insights({ study, today }: { study: Study; today: string }) {
  const { settings, subjects, logs } = study
  const date = parseYmd(today)
  const wk = weekKey(date)
  const suggested = quoteOfWeek(date)
  const custom = settings.quote && settings.quote_week === wk ? settings.quote : null
  const quote = custom ?? suggested

  const days = weekDays(date)
  const perDay = minutesByDay(logs.rows, days)
  const weekTotal = perDay.reduce((a, b) => a + b, 0)
  const goal = settings.weekly_goal_min
  const dailyTarget = goal / 7
  const scale = Math.max(...perDay, dailyTarget, 60)
  const bySubject = minutesBySubject(logs.rows, days)
  const withGoal = subjects.rows.filter((s) => s.weekly_goal_min > 0)
  const monthPrefix = today.slice(0, 7)
  const monthTotal = sumMinutes(logs.rows.filter((l) => l.studied_on.startsWith(monthPrefix)))
  const allTotal = sumMinutes(logs.rows)

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
    <section aria-labelledby="insights" className="overflow-hidden rounded-[28px] bg-band p-6 text-on-band md:p-10">
      <h2 id="insights" className="sr-only">Insights e metas</h2>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-on-band2">Frase da semana</h3>
          {editQuote ? (
            <form onSubmit={saveQuote} className="mt-3 space-y-3">
              <label className="sr-only" htmlFor="frase">Frase da semana</label>
              <textarea id="frase" className="input min-h-32 !bg-white/10 !text-on-band !border-white/25" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={240} autoFocus />
              <div className="flex gap-2">
                <button className="btn !bg-on-band !text-band" type="submit">Salvar frase</button>
                <button className="btn-ghost !border-white/30 !text-on-band hover:!bg-white/10" type="button" onClick={() => setEditQuote(false)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              <blockquote className="mt-3 max-w-[34ch] font-display text-3xl font-medium leading-[1.2] tracking-tight md:text-[2.4rem]">{quote}</blockquote>
              <div className="mt-5 flex flex-wrap gap-1">
                <button className="btn-quiet !text-on-band2 hover:!bg-white/10 hover:!text-on-band" onClick={() => { setDraft(quote); setEditQuote(true) }}><Pencil size={14} aria-hidden /> Escrever a minha</button>
                {custom && <button className="btn-quiet !text-on-band2 hover:!bg-white/10 hover:!text-on-band" onClick={() => study.saveSettings({ quote: null, quote_week: null })}>Voltar à sugerida</button>}
              </div>
            </>
          )}
          <dl className="mt-auto grid grid-cols-3 gap-4 pt-10">
            {[
              { k: 'Sequência', v: `${streak(logs.rows, today)} ${streak(logs.rows, today) === 1 ? 'dia' : 'dias'}` },
              { k: 'No mês', v: fmtDuration(monthTotal) },
              { k: 'Total registrado', v: fmtDuration(allTotal) },
            ].map((x) => (
              <div key={x.k}><dd className="tnum font-display text-2xl font-semibold md:text-3xl">{x.v}</dd><dt className="mt-0.5 text-sm text-on-band2">{x.k}</dt></div>
            ))}
          </dl>
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-on-band2">Horas brutas da semana</h3>
              <p className="tnum mt-1 font-display text-5xl font-semibold leading-none md:text-6xl">{fmtDuration(weekTotal)}</p>
            </div>
            {editGoal ? (
              <form onSubmit={saveGoal} className="flex items-center gap-2">
                <label className="text-sm text-on-band2" htmlFor="meta">Meta (horas)</label>
                <input id="meta" className="input !w-20 !bg-white/10 !text-on-band !border-white/25 tnum" inputMode="decimal" value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} autoFocus />
                <button className="btn !bg-on-band !text-band" type="submit">OK</button>
              </form>
            ) : (
              <button className="btn-quiet !text-on-band2 hover:!bg-white/10 hover:!text-on-band" onClick={() => { setGoalDraft(minutesToHours(goal)); setEditGoal(true) }}>
                Meta {goal ? fmtDuration(goal) : 'não definida'} <Pencil size={13} aria-hidden />
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-7 items-end gap-2" role="img" aria-label={`Minutos por dia: ${WEEKDAYS_SHORT.map((d, i) => `${d} ${perDay[i]}`).join(', ')}. Média diária para bater a meta: ${Math.round(dailyTarget)} min.`}>
            {perDay.map((m, i) => {
              const isToday = days[i] === today
              return (
                <div key={days[i]} className="flex flex-col items-center gap-1.5">
                  <span className="tnum text-xs text-on-band2">{m ? fmtDuration(m) : ''}</span>
                  <div className="relative flex h-32 w-full items-end">
                    {goal > 0 && <div className="absolute inset-x-0 border-t border-dashed border-white/40" style={{ bottom: `${(dailyTarget / scale) * 100}%` }} aria-hidden />}
                    <div className={`w-full rounded-t-md ${isToday ? 'bg-marker' : 'bg-on-band/85'}`} style={{ height: `${Math.max(m ? 3 : 0, (m / scale) * 100)}%`, minHeight: m ? 4 : 0 }} />
                  </div>
                  <span className={`text-xs ${isToday ? 'font-semibold text-on-band' : 'text-on-band2'}`}>{WEEKDAYS_SHORT[i]}</span>
                </div>
              )
            })}
          </div>
          {goal > 0 && <p className="mt-2 text-xs text-on-band2">A linha tracejada é a média diária para chegar a {fmtDuration(goal)} no fim da semana.</p>}

          {withGoal.length > 0 && (
            <ul className="mt-6 space-y-3">
              {withGoal.map((s) => {
                const m = bySubject.get(s.id) ?? 0
                const pct = Math.min(100, Math.round((m / s.weekly_goal_min) * 100))
                return (
                  <li key={s.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium"><Dot color={s.color} />{s.name}</span>
                      <span className="tnum text-on-band2">{fmtDuration(m)} de {fmtDuration(s.weekly_goal_min)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name}: ${pct}% da meta semanal`}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
