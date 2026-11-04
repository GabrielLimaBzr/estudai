'use client'
import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { SectionHead, subjectColor, subjectName } from '@/components/ui'
import type { OpenDialog } from '@/components/dialogs'
import type { Study } from '@/hooks/useStudy'
import { WEEKDAYS, WEEKDAYS_SHORT, addDays, fmtDuration, hhmm, parseYmd, shortDay, weekDays } from '@/lib/dates'
import { blockMinutesDone, blocksOfDay, minutesByDay, sumMinutes } from '@/lib/study'

export function Week({ study, today, open }: { study: Study; today: string; open: OpenDialog }) {
  const [offset, setOffset] = useState(0)
  const days = weekDays(addDays(parseYmd(today), offset * 7))
  const { subjects, blocks, logs } = study
  const planned = blocks.rows.reduce((n, b) => n + b.minutes, 0)
  const doneByDay = minutesByDay(logs.rows, days)
  const done = doneByDay.reduce((a, b) => a + b, 0)
  const first = parseYmd(days[0]), last = parseYmd(days[6])
  const label = offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana passada' : offset === 1 ? 'Próxima semana' : `${shortDay(first)} a ${shortDay(last)}`

  return (
    <section aria-labelledby="semana">
      <SectionHead id="semana" title="Semana"
        summary={`${label}, ${shortDay(first)} a ${shortDay(last)}. ${fmtDuration(planned)} planejadas, ${fmtDuration(done)} feitas.`}
        actions={<>
          <div className="inline-flex items-center rounded-xl border border-rule bg-sheet" role="group" aria-label="Navegar entre semanas">
            <button className="btn-quiet !rounded-r-none" onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior"><ChevronLeft size={16} aria-hidden /></button>
            <button className="btn-quiet !rounded-none border-x border-rule" onClick={() => setOffset(0)} disabled={offset === 0}>Hoje</button>
            <button className="btn-quiet !rounded-l-none" onClick={() => setOffset((o) => o + 1)} aria-label="Próxima semana"><ChevronRight size={16} aria-hidden /></button>
          </div>
          <button className="btn-ghost" onClick={() => open({ k: 'block' })}><Plus size={16} aria-hidden /> Bloco</button>
        </>} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7 lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-rule lg:bg-sheet">
        {days.map((day, i) => {
          const isToday = day === today
          const past = day < today
          const dayBlocks = blocksOfDay(blocks.rows, i)
          const plannedDay = dayBlocks.reduce((n, b) => n + b.minutes, 0)
          return (
            <div key={day} className={`flex min-h-48 flex-col rounded-xl border border-rule bg-sheet lg:rounded-none lg:border-0 ${i > 0 ? 'lg:border-l lg:border-rule' : ''}`}>
              <div className={`flex items-baseline justify-between gap-2 px-3 py-2.5 ${isToday ? 'now' : 'border-b border-rule'}`} aria-current={isToday ? 'date' : undefined}>
                <h3 className="text-base font-semibold"><span className="lg:hidden">{WEEKDAYS[i]}</span><span className="hidden lg:inline">{WEEKDAYS_SHORT[i]}</span></h3>
                <span className={`tnum text-sm ${isToday ? 'muted' : 'text-ink2'}`}>{parseYmd(day).getDate()}</span>
              </div>
              <ul className="flex flex-1 flex-col gap-1.5 p-2">
                {dayBlocks.map((b) => {
                  const m = blockMinutesDone(b, day, logs.rows)
                  const ok = m > 0
                  const missed = past && !ok
                  return (
                    <li key={b.id}>
                      <button onClick={() => open({ k: 'block', item: b })}
                        className={`w-full rounded-lg border-l-[3px] bg-sunk px-2.5 py-2 text-left transition-colors hover:brightness-110 ${missed ? 'opacity-55' : ''}`} style={{ borderLeftColor: subjectColor(subjects.rows, b.subject_id) }}>
                        <span className="flex items-center justify-between gap-1">
                          <span className="tnum text-xs font-semibold text-ink2">{hhmm(b.start_time)} · {fmtDuration(b.minutes)}</span>
                          {ok && <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-ok"><Check size={13} strokeWidth={3} aria-hidden /><span className="sr-only">Feito</span></span>}
                        </span>
                        <span className={`mt-0.5 block text-sm font-semibold leading-snug ${ok ? 'line-through decoration-ink3' : ''}`}>{subjectName(subjects.rows, b.subject_id) ?? b.title ?? 'Bloco livre'}</span>
                        {b.title && b.subject_id && <span className="block truncate text-xs text-ink2">{b.title}</span>}
                      </button>
                    </li>
                  )
                })}
                {dayBlocks.length === 0 && <li className="px-1 pt-1 text-xs text-ink3">Dia livre</li>}
              </ul>
              <div className="flex items-center justify-between gap-1 border-t border-rule px-2 py-1.5 text-xs text-ink2">
                <span className="tnum">{plannedDay ? `${fmtDuration(doneByDay[i])} de ${fmtDuration(plannedDay)}` : doneByDay[i] ? fmtDuration(doneByDay[i]) : ''}</span>
                <button className="btn-quiet !min-h-7 !px-1.5" onClick={() => open({ k: 'block', weekday: i })} aria-label={`Adicionar bloco na ${WEEKDAYS[i].toLowerCase()}`}><Plus size={14} aria-hidden /></button>
              </div>
            </div>
          )
        })}
      </div>
      {sumMinutes(logs.rows) === 0 && blocks.rows.length > 0 && <p className="mt-3 text-sm text-ink2">Marque “Feito” em Hoje ou use o cronômetro: os blocos concluídos aparecem aqui com um visto.</p>}
    </section>
  )
}
