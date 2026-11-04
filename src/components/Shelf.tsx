'use client'
import { useState } from 'react'
import { BookOpen, ExternalLink, FileText, GraduationCap, Link2, Pencil, Plus, Video, type LucideIcon } from 'lucide-react'
import { Dot, PageHeader, subjectColor, subjectName } from '@/components/ui'
import type { ReadyApp } from '@/contexts/app'
import { LINK_KINDS, LINK_LABEL, type LinkKind } from '@/lib/types'

const ICON: Record<LinkKind, LucideIcon> = { pdf: FileText, livro: BookOpen, curso: GraduationCap, video: Video, link: Link2 }

export function Shelf({ app }: { app: ReadyApp }) {
  const { study, open } = app
  const [kind, setKind] = useState<LinkKind | 'all'>('all')
  const { links, subjects } = study
  const items = [...links.rows].filter((l) => kind === 'all' || l.kind === kind).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  const used = LINK_KINDS.filter((k) => links.rows.some((l) => l.kind === k))

  return (
    <div className="mx-auto max-w-3xl lg:mx-0">
      <PageHeader title="Materiais" summary={links.rows.length ? `${links.rows.length} ${links.rows.length === 1 ? 'item' : 'itens'} guardados.` : undefined}
        actions={<button className="btn-ghost" onClick={() => open({ k: 'link' })}><Plus size={16} aria-hidden /> Material</button>} />

      {used.length > 1 && (
        <div className="seg mb-5 flex-wrap" role="group" aria-label="Filtrar por tipo">
          <button aria-pressed={kind === 'all'} onClick={() => setKind('all')}>Tudo</button>
          {used.map((k) => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{LINK_LABEL[k]}</button>)}
        </div>
      )}

      {links.rows.length === 0 ? (
        <p className="sheet p-6 text-ink2">Guarde aqui a trilha do Microsoft Learn, o PDF do curso, o livro de inglês e os vídeos. Tudo a um clique, sem caçar nas abas.</p>
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {items.map((l) => {
            const Icon = ICON[l.kind]
            const body = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-rule" style={{ color: subjectColor(subjects.rows, l.subject_id) }}><Icon size={19} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[15px] font-medium"><span className="truncate">{l.title}</span>{l.url && <ExternalLink size={13} className="shrink-0 text-ink3" aria-hidden />}</span>
                  <span className="flex flex-wrap items-center gap-x-2.5 text-xs text-ink2">
                    <span>{LINK_LABEL[l.kind]}</span>
                    {l.subject_id && <span className="inline-flex items-center gap-1.5"><Dot color={subjectColor(subjects.rows, l.subject_id)} size={7} />{subjectName(subjects.rows, l.subject_id)}</span>}
                    {l.note && <span className="truncate">{l.note}</span>}
                  </span>
                </span>
              </>
            )
            return (
              <li key={l.id} className="group flex items-center gap-1 py-3.5">
                {l.url
                  ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-3.5 rounded-md">{body}</a>
                  : <div className="flex min-w-0 flex-1 items-center gap-3.5">{body}</div>}
                <button className="btn-quiet opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100" onClick={() => open({ k: 'link', item: l })} aria-label={`Editar ${l.title}`}><Pencil size={15} aria-hidden /></button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
