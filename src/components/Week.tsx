'use client'
import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, FileUp, Plus } from 'lucide-react'
import { Dot, PageHeader, shortName, subjectColor, subjectName } from '@/components/ui'
import type { ReadyApp } from '@/contexts/app'
import { WEEKDAYS, WEEKDAYS_SHORT, addDays, fmtDuration, hhmm, parseYmd, shortDay, weekDays } from '@/lib/dates'
import { agendaForDay } from '@/lib/agenda'
import { minutesByDay } from '@/lib/study'

export function Week({ app }: { app: ReadyApp }) {
  const { study, today, open } = app
  const [offset, setOffset] = useState(0)
  const days = weekDays(addDays(parseYmd(today), offset * 7))
  const { subjects, blocks, logs, sessions } = study
  const agenda = days.map((d) => agendaForDay(d, blocks.rows, sessions.rows, logs.rows))
  const planned = agenda.flat().reduce((n, i) => n + i.minutes, 0)
  const doneByDay = minutesByDay(logs.rows, days)
  const done = doneByDay.reduce((a, b) => a + b, 0)
  const first = parseYmd(days[0]), last = parseYmd(days[6])
  const label = offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana passada' : offset === 1 ? 'Próxima semana' : 'Semana'

  return (
    <>
      <PageHeader title="Semana"
        summary={<>{label}, {shortDay(first)} a {shortDay(last)}. <span className="tnum">{fmtDuration(done)}</span> de {fmtDuration(planned)} planejadas.</>}
        actions={<>
          <div className="seg" role="group" aria-label="Navegar entre semanas">
            <button onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior" className="grid place-items-center !px-2"><ChevronLeft size={16} aria-hidden /></button>
            <button onClick={() => setOffset(0)} disabled={offset === 0} className="disabled:opacity-40">Hoje</button>
            <button onClick={() => setOffset((o) => o + 1)} aria-label="Próxima semana" className="grid place-items-center !px-2"><ChevronRight size={16} aria-hidden /></button>
          </div>
          <button className="btn-ghost" onClick={() => open({ k: 'import' })}><FileUp size={15} aria-hidden /> Importar cronograma</button>
          <button className="btn-ghost" onClick={() => open({ k: 'block' })}><Plus size={16} aria-hidden /> Bloco</button>
        </>} />

      <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-rule bg-sheet sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day, i) => {
          const isToday = day === today
          const past = day < today
          const dayBlocks = agenda[i]
          const plannedDay = dayBlocks.reduce((n, b) => n + b.minutes, 0)
          return (
            <section key={day} aria-label={`${WEEKDAYS[i]}, ${parseYmd(day).getDate()}`}
              className={`group flex min-h-56 flex-col border-rule p-3 max-lg:border-t first:max-lg:border-t-0 lg:border-l lg:first:border-l-0 ${isToday ? 'bg-sunk' : ''}`}>
              <div className="mb-3 flex items-baseline justify-between" aria-current={isToday ? 'date' : undefined}>
                <h2 className={`font-sans text-xs ${isToday ? 'font-semibold text-accent' : 'text-ink2'}`}><span className="lg:hidden">{WEEKDAYS[i]}</span><span className="hidden lg:inline">{WEEKDAYS_SHORT[i]}</span></h2>
                <span className={`tnum font-display text-2xl leading-none ${isToday ? 'font-semibold text-accent' : ''}`}>{parseYmd(day).getDate()}</span>
              </div>
              <ul className="flex flex-1 flex-col gap-1">
                {dayBlocks.map((b) => {
                  const ok = b.done
                  const missed = past && !ok
                  const edit = () => {
                    if (b.kind === 'session') { const sess = sessions.rows.find((x) => x.id === b.refId); if (sess) open({ k: 'session', item: sess }) }
                    else { const blk = blocks.rows.find((x) => x.id === b.refId); if (blk) open({ k: 'block', item: blk }) }
                  }
                  return (
                    <li key={b.id}>
                      <button onClick={edit} className={`w-full rounded-md border border-transparent p-2 text-left transition-colors hover:border-rule hover:bg-sheet ${missed ? 'opacity-50' : ''}`}>
                        <span className="flex items-center justify-between gap-2">
                          <span className="tnum text-xs text-ink2">{hhmm(b.start_time)} · {fmtDuration(b.minutes)}</span>
                          {ok && <Check size={13} strokeWidth={3} className="text-ok" aria-label="Feito" />}
                        </span>
                        <span className={`mt-1 flex items-center gap-2 text-sm font-medium leading-snug ${ok ? 'text-ink3 line-through' : ''}`}>
                          <Dot color={subjectColor(subjects.rows, b.subject_id)} size={8} />
                          <span className="min-w-0 truncate">{shortName(subjectName(subjects.rows, b.subject_id)) ?? b.label ?? 'Bloco livre'}</span>
                        </span>
                        {b.label && b.subject_id && <span className="mt-0.5 line-clamp-4 block break-words pl-4 text-xs leading-snug text-ink2">{b.label}</span>}
                      </button>
                    </li>
                  )
                })}
                {dayBlocks.length === 0 && <li className="px-2 pt-1 text-sm text-ink3">Livre</li>}
              </ul>
              <div className="mt-3 flex items-center justify-between text-xs text-ink3">
                <span className="tnum">{plannedDay ? fmtDuration(plannedDay) : ''}</span>
                <button className="btn-quiet !min-h-7 !px-1.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100" onClick={() => open({ k: 'block', weekday: i })} aria-label={`Adicionar bloco na ${WEEKDAYS[i].toLowerCase()}`}><Plus size={14} aria-hidden /></button>
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
