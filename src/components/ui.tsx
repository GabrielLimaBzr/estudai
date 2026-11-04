'use client'
import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import type { Subject } from '@/lib/types'

/** Janela de formulário. Fecha com Esc ou clicando fora; devolve o foco a quem a abriu. */
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const titleId = useId()
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; opener?.focus?.() }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="fade-in absolute inset-0 bg-black/55" onClick={onClose} />
      <div ref={box} className={`pop-in sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-2xl sm:rounded-b-2xl ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'}`} style={{ boxShadow: 'var(--shadow-float)' }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" data-close onClick={onClose} aria-label="Fechar" className="btn-quiet -mr-2 size-9 !p-0"><X size={18} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-ink2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink3">{hint}</span>}
    </label>
  )
}

/** Cabeçalho de seção: título + resumo curto à esquerda, ações à direita. */
export function SectionHead({ id, title, summary, actions }: { id?: string; title: string; summary?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 id={id} className="text-2xl font-semibold leading-tight">{title}</h2>
        {summary && <p className="mt-0.5 text-sm text-ink2">{summary}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
    </div>
  )
}

export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return <span aria-hidden className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: color }} />
}

export const subjectColor = (subjects: Subject[], id: string | null) => subjects.find((s) => s.id === id)?.color ?? 'var(--ink3)'
export const subjectName = (subjects: Subject[], id: string | null) => subjects.find((s) => s.id === id)?.name ?? null

export function SubjectSelect({ subjects, value, onChange, none = 'Sem matéria' }: { subjects: Subject[]; value: string | null; onChange: (v: string | null) => void; none?: string }) {
  return (
    <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{none}</option>
      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  )
}

export const SUBJECT_COLORS = ['#ff6f61', '#2f8cff', '#3ccf9b', '#8b7bff', '#f0b23c', '#e85d9b'] as const

/** Meta em horas (aceita vírgula) → minutos; vazio = 0. */
export function hoursToMinutes(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 60) : 0
}
export const minutesToHours = (m: number) => (m ? String(+(m / 60).toFixed(2)).replace('.', ',') : '')
