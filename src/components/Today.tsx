'use client'
import { Check, CircleCheck, Pencil, Play, Plus, Undo2 } from 'lucide-react'
import { Dot, SectionHead, subjectColor, subjectName } from '@/components/ui'
import type { OpenDialog } from '@/components/dialogs'
import type { Study } from '@/hooks/useStudy'
import type { TimerApi } from '@/hooks/useTimer'
import { daysBetween, fmtDuration, hhmm, longDate, parseYmd, shortDay, weekdayIndex } from '@/lib/dates'
import { blockMinutesDone, blocksOfDay, nowPointer, sumMinutes, urgentTasks } from '@/lib/study'
import type { Block, Task } from '@/lib/types'

function dueLabel(t: Task, today: string): string | null {
  if (!t.due_on) return null
  const d = daysBetween(today, t.due_on)
  if (d < 0) return `Atrasada há ${-d} ${d === -1 ? 'dia' : 'dias'}`
  if (d === 0) return 'Vence hoje'
  if (d === 1) return 'Vence amanhã'
  return `Vence em ${shortDay(parseYmd(t.due_on))}`
}

export function Today({ study, today, nowMin, timer, open }: { study: Study; today: string; nowMin: number; timer: TimerApi; open: OpenDialog }) {
  const { subjects, tasks, blocks, logs } = study
  const date = parseYmd(today)
  const todayBlocks = blocksOfDay(blocks.rows, weekdayIndex(date))
  const todayLogs = logs.rows.filter((l) => l.studied_on === today)
  const doneMin = (b: Block) => blockMinutesDone(b, today, logs.rows)
  const pointer = nowPointer(todayBlocks, nowMin, (b) => doneMin(b) > 0)
  const urgent = urgentTasks(tasks.rows, today)
  const planned = todayBlocks.reduce((n, b) => n + b.minutes, 0)
  const studied = sumMinutes(todayLogs)

  async function complete(b: Block) {
    await logs.insert({ subject_id: b.subject_id, block_id: b.id, studied_on: today, minutes: b.minutes }, 'registrar o bloco')
  }
  async function undo(b: Block) {
    for (const l of todayLogs.filter((x) => x.block_id === b.id)) await logs.remove(l.id, 'desfazer o registro')
  }

  const summary = todayBlocks.length
    ? `${longDate(date)}. ${fmtDuration(planned)} planejadas, ${fmtDuration(studied)} feitas.`
    : `${longDate(date)}. Nenhum bloco planejado.`

  return (
    <section aria-labelledby="hoje" className="border-l-2 border-rule pl-4 md:pl-7">
      <SectionHead id="hoje" title="Hoje" summary={summary}
        actions={<button className="btn-ghost" onClick={() => open({ k: 'task' })}><Plus size={16} aria-hidden /> Tarefa</button>} />

      <h3 className="mb-2 text-sm font-semibold text-ink2">Urgente</h3>
      {urgent.length === 0 ? (
        <p className="mb-6 flex items-center gap-2 text-sm text-ink2"><CircleCheck size={16} className="text-ok" aria-hidden /> Nada urgente. Marque uma tarefa como urgente ou dê um prazo para ela aparecer aqui.</p>
      ) : (
        <ul className="mb-6 divide-y divide-rule border-y border-rule">
          {urgent.map((t) => {
            const due = dueLabel(t, today)
            const late = !!t.due_on && t.due_on < today
            return (
              <li key={t.id} className="group flex items-center gap-3 py-2.5">
                <button onClick={() => tasks.patch(t.id, { done: true }, 'concluir a tarefa')} role="checkbox" aria-checked="false" aria-label={`Concluir: ${t.title}`}
                  className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-ink3 text-transparent transition-colors hover:border-ink hover:text-ink"><Check size={14} strokeWidth={3} aria-hidden /></button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-ink2">
                    {t.subject_id && <span className="inline-flex items-center gap-1.5"><Dot color={subjectColor(subjects.rows, t.subject_id)} size={8} />{subjectName(subjects.rows, t.subject_id)}</span>}
                    {due && <span className={late ? 'font-semibold text-bad' : ''}>{due}</span>}
                  </p>
                </div>
                <button className="btn-quiet opacity-60 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => open({ k: 'task', item: t })} aria-label={`Editar: ${t.title}`}><Pencil size={15} aria-hidden /></button>
              </li>
            )
          })}
        </ul>
      )}

      <h3 className="mb-2 text-sm font-semibold text-ink2">Blocos de hoje</h3>
      {todayBlocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rule p-5 text-sm text-ink2">
          Hoje está livre. Crie um bloco fixo para {['segunda','terça','quarta','quinta','sexta','sábado','domingo'][weekdayIndex(date)]} e ele se repete toda semana.
          <div className="mt-3"><button className="btn-ghost" onClick={() => open({ k: 'block', weekday: weekdayIndex(date) })}><Plus size={16} aria-hidden /> Bloco de estudo</button></div>
        </div>
      ) : (
        <ul className="space-y-2">
          {todayBlocks.map((b) => {
            const done = doneMin(b) > 0
            const isNow = pointer.current === b.id
            const isNext = pointer.next === b.id
            return (
              <li key={b.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 ${isNow ? 'now border-transparent' : 'border-rule bg-sheet'} ${done ? 'opacity-70' : ''}`}>
                <div className="w-16 shrink-0">
                  <p className="tnum font-display text-xl font-semibold leading-none">{hhmm(b.start_time)}</p>
                  <p className={`mt-1 text-xs ${isNow ? 'muted' : 'text-ink2'}`}>{fmtDuration(b.minutes)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`flex items-center gap-2 font-semibold ${done ? 'line-through' : ''}`}>
                    <Dot color={subjectColor(subjects.rows, b.subject_id)} />
                    <span className="truncate">{subjectName(subjects.rows, b.subject_id) ?? b.title ?? 'Bloco livre'}</span>
                  </p>
                  <p className={`truncate text-sm ${isNow ? 'muted' : 'text-ink2'}`}>
                    {isNow ? 'Agora' : isNext ? 'Próximo' : done ? `Feito, ${fmtDuration(doneMin(b))}` : ''}
                    {(isNow || isNext) && b.title && b.subject_id ? ` · ${b.title}` : !(isNow || isNext || done) ? b.title ?? '' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {done ? (
                    <button className="btn-quiet" onClick={() => undo(b)}><Undo2 size={15} aria-hidden /> Desfazer</button>
                  ) : (
                    <>
                      {timer.timer.status !== 'idle' && timer.timer.blockId === b.id ? (
                        <span className="px-3 text-sm font-semibold">{timer.timer.status === 'running' ? 'No cronômetro' : 'Pausado'}</span>
                      ) : (
                        <button className={isNow ? 'btn' : 'btn-ghost'} onClick={() => timer.begin({ durationMin: b.minutes, subjectId: b.subject_id, blockId: b.id })}
                          disabled={timer.timer.status === 'running'} title={timer.timer.status === 'running' ? 'Já existe uma sessão rodando no Foco' : undefined}>
                          <Play size={14} aria-hidden /> Iniciar
                        </button>
                      )}
                      <button className="btn-quiet" onClick={() => complete(b)} aria-label={`Marcar como feito: ${b.title ?? subjectName(subjects.rows, b.subject_id) ?? 'bloco'}`}><Check size={16} aria-hidden /> Feito</button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
