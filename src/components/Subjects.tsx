'use client'
import { Minus, Pencil, Plus, RefreshCw, Star } from 'lucide-react'
import { Dot, SectionHead } from '@/components/ui'
import type { OpenDialog } from '@/components/dialogs'
import type { Study } from '@/hooks/useStudy'
import { progressPct, reviewStatus, type ReviewKind } from '@/lib/study'
import type { Subject } from '@/lib/types'

const REVIEW_COLOR: Record<ReviewKind, string> = { idle: 'var(--ink3)', never: 'var(--warn)', late: 'var(--bad)', soon: 'var(--warn)', ok: 'var(--ok)' }

export function Subjects({ study, today, open }: { study: Study; today: string; open: OpenDialog }) {
  const { subjects } = study
  const rows = [...subjects.rows].sort((a, b) => Number(b.priority) - Number(a.priority) || a.name.localeCompare(b.name, 'pt-BR'))
  const total = rows.reduce((n, s) => n + s.total_lessons, 0)
  const watched = rows.reduce((n, s) => n + s.watched_lessons, 0)
  const toReview = rows.filter((s) => ['late', 'never', 'soon'].includes(reviewStatus(s, today).kind)).length

  const step = (s: Subject, delta: number) => {
    const max = s.total_lessons > 0 ? s.total_lessons : Infinity
    const next = Math.min(max, Math.max(0, s.watched_lessons + delta))
    if (next !== s.watched_lessons) subjects.patch(s.id, { watched_lessons: next }, 'atualizar as aulas')
  }

  return (
    <section aria-labelledby="materias">
      <SectionHead id="materias" title="Matérias"
        summary={rows.length ? `${watched} de ${total} aulas assistidas${toReview ? `, ${toReview} para revisar` : ''}.` : undefined}
        actions={<button className="btn-ghost" onClick={() => open({ k: 'subject' })}><Plus size={16} aria-hidden /> Matéria</button>} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rule p-6 text-sm text-ink2">
          Cadastre as matérias que você está estudando (ex.: Inglês, Azure) com o total de aulas. O painel calcula o progresso e avisa quando é hora de revisar.
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <caption className="sr-only">Progresso por matéria</caption>
            <thead>
              <tr className="border-b-2 border-ink/80 text-ink2">
                <th scope="col" className="py-2 pr-3 font-semibold">Matéria</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Total</th>
                <th scope="col" className="px-3 py-2 text-center font-semibold">Assistidas</th>
                <th scope="col" className="w-44 px-3 py-2 font-semibold">Concluído</th>
                <th scope="col" className="px-3 py-2 font-semibold">Revisão</th>
                <th scope="col" className="py-2 pl-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const pct = progressPct(s.watched_lessons, s.total_lessons)
                const rev = reviewStatus(s, today)
                const needs = rev.kind === 'late' || rev.kind === 'never' || rev.kind === 'soon'
                return (
                  <tr key={s.id} className="border-b border-rule align-middle">
                    <th scope="row" className="py-3 pr-3 font-normal">
                      <span className="flex items-center gap-2.5">
                        <Dot color={s.color} size={12} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-semibold">{s.name}{s.priority && <Star size={13} className="fill-marker text-marker" aria-label="Prioridade do ano" />}</span>
                          {s.area && <span className="block text-xs text-ink2">{s.area}</span>}
                        </span>
                      </span>
                    </th>
                    <td className="tnum px-3 py-3 text-right">{s.total_lessons || <span className="text-ink3">sem total</span>}</td>
                    <td className="px-3 py-3">
                      <span className="mx-auto flex w-fit items-center rounded-lg border border-rule">
                        <button className="btn-quiet !min-h-8 !rounded-r-none !px-2" onClick={() => step(s, -1)} disabled={s.watched_lessons <= 0} aria-label={`Menos uma aula em ${s.name}`}><Minus size={14} aria-hidden /></button>
                        <span className="tnum min-w-9 text-center font-semibold" aria-live="polite">{s.watched_lessons}</span>
                        <button className="btn-quiet !min-h-8 !rounded-l-none !px-2" onClick={() => step(s, 1)} disabled={s.total_lessons > 0 && s.watched_lessons >= s.total_lessons} aria-label={`Mais uma aula em ${s.name}`}><Plus size={14} aria-hidden /></button>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name}: ${pct}% concluído`}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                        </div>
                        <span className="tnum w-10 text-right font-semibold">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Dot color={REVIEW_COLOR[rev.kind]} size={8} />
                        <span className={rev.kind === 'late' ? 'font-semibold' : 'text-ink2'}>{rev.label}</span>
                        {needs && <button className="btn-quiet !min-h-7 !px-2" onClick={() => subjects.patch(s.id, { last_reviewed_on: today }, 'registrar a revisão')}><RefreshCw size={13} aria-hidden /> Revisei hoje</button>}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right"><button className="btn-quiet" onClick={() => open({ k: 'subject', item: s })} aria-label={`Editar ${s.name}`}><Pencil size={15} aria-hidden /></button></td>
                  </tr>
                )
              })}
            </tbody>
            {rows.length > 1 && total > 0 && (
              <tfoot>
                <tr className="text-ink2">
                  <th scope="row" className="py-2.5 pr-3 text-left font-semibold">Geral</th>
                  <td className="tnum px-3 py-2.5 text-right">{total}</td>
                  <td className="tnum px-3 py-2.5 text-center">{watched}</td>
                  <td className="tnum px-3 py-2.5 font-semibold">{progressPct(watched, total)}%</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  )
}
