'use client'
import { useState } from 'react'
import { BookOpen, ExternalLink, FileText, GraduationCap, Link2, Pencil, Plus, Video, type LucideIcon } from 'lucide-react'
import { Dot, SectionHead, subjectColor, subjectName } from '@/components/ui'
import type { OpenDialog } from '@/components/dialogs'
import type { Study } from '@/hooks/useStudy'
import { LINK_KINDS, LINK_LABEL, type LinkKind } from '@/lib/types'

const ICON: Record<LinkKind, LucideIcon> = { pdf: FileText, livro: BookOpen, curso: GraduationCap, video: Video, link: Link2 }

export function Shelf({ study, open }: { study: Study; open: OpenDialog }) {
  const [kind, setKind] = useState<LinkKind | 'all'>('all')
  const { links, subjects } = study
  const items = [...links.rows].filter((l) => kind === 'all' || l.kind === kind).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  const used = LINK_KINDS.filter((k) => links.rows.some((l) => l.kind === k))

  return (
    <section aria-labelledby="materiais" className="sheet flex h-full flex-col p-4 md:p-5">
      <SectionHead id="materiais" title="Materiais" summary={links.rows.length ? `${links.rows.length} ${links.rows.length === 1 ? 'item' : 'itens'} na estante.` : undefined}
        actions={<button className="btn-ghost" onClick={() => open({ k: 'link' })}><Plus size={16} aria-hidden /> Material</button>} />

      {used.length > 1 && (
        <div className="seg mb-3 flex-wrap self-start" role="group" aria-label="Filtrar por tipo">
          <button aria-pressed={kind === 'all'} onClick={() => setKind('all')}>Tudo</button>
          {used.map((k) => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{LINK_LABEL[k]}</button>)}
        </div>
      )}

      {links.rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rule p-4 text-sm text-ink2">
          Guarde aqui a trilha do Microsoft Learn, o PDF do curso, o livro de inglês e os vídeos. Tudo a um clique, sem caçar nas abas.
        </p>
      ) : (
        <ul className="-mx-2 divide-y divide-rule">
          {items.map((l) => {
            const Icon = ICON[l.kind]
            const body = (
              <>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunk" style={{ color: subjectColor(subjects.rows, l.subject_id) }}><Icon size={18} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-semibold"><span className="truncate">{l.title}</span>{l.url && <ExternalLink size={13} className="shrink-0 text-ink3" aria-hidden />}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-xs text-ink2">
                    <span>{LINK_LABEL[l.kind]}</span>
                    {l.subject_id && <span className="inline-flex items-center gap-1"><Dot color={subjectColor(subjects.rows, l.subject_id)} size={7} />{subjectName(subjects.rows, l.subject_id)}</span>}
                    {l.note && <span className="truncate">{l.note}</span>}
                  </span>
                </span>
              </>
            )
            return (
              <li key={l.id} className="group flex items-center gap-1 px-2 py-2">
                {l.url
                  ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-0.5 hover:bg-sunk/70">{body}</a>
                  : <div className="flex min-w-0 flex-1 items-center gap-3 py-0.5">{body}</div>}
                <button className="btn-quiet opacity-60 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => open({ k: 'link', item: l })} aria-label={`Editar ${l.title}`}><Pencil size={15} aria-hidden /></button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
