'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Field, Modal, SUBJECT_COLORS, SubjectSelect, hoursToMinutes, minutesToHours } from '@/components/ui'
import { WEEKDAYS, hhmm, ymd } from '@/lib/dates'
import { LINK_KINDS, LINK_LABEL, type Block, type LinkItem, type LinkKind, type StudyLog, type Subject, type Task } from '@/lib/types'

/** Rodapé padrão dos formulários: excluir (se for edição) à esquerda, cancelar e salvar à direita. */
function Actions({ busy, onCancel, onDelete, save = 'Salvar' }: { busy: boolean; onCancel: () => void; onDelete?: () => void; save?: string }) {
  return (
    <div className="mt-5 flex items-center gap-2">
      {onDelete && <button type="button" className="btn-quiet !text-bad" onClick={onDelete} disabled={busy}><Trash2 size={15} aria-hidden /> Excluir</button>}
      <span className="flex-1" />
      <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
      <button type="submit" className="btn" disabled={busy}>{save}</button>
    </div>
  )
}

interface FormProps<T> { initial?: T; onSave: (v: Partial<T>) => Promise<boolean>; onDelete?: () => Promise<boolean>; onClose: () => void }

function useSubmit(onSave: () => Promise<boolean>, onClose: () => void) {
  const [busy, setBusy] = useState(false)
  return {
    busy,
    submit: async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); const ok = await onSave(); setBusy(false); if (ok) onClose() },
    run: async (fn: () => Promise<boolean>) => { setBusy(true); const ok = await fn(); setBusy(false); if (ok) onClose() },
  }
}

const num = (v: string, fallback = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : fallback }

export function SubjectForm({ initial, onSave, onDelete, onClose }: FormProps<Subject>) {
  const [name, setName] = useState(initial?.name ?? '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [color, setColor] = useState(initial?.color ?? SUBJECT_COLORS[1])
  const [total, setTotal] = useState(String(initial?.total_lessons ?? ''))
  const [watched, setWatched] = useState(String(initial?.watched_lessons ?? 0))
  const [goal, setGoal] = useState(minutesToHours(initial?.weekly_goal_min ?? 0))
  const [every, setEvery] = useState(String(initial?.review_every_days ?? 14))
  const [priority, setPriority] = useState(initial?.priority ?? false)
  const { busy, submit, run } = useSubmit(() => onSave({
    name: name.trim(), area: area.trim() || null, color, total_lessons: num(total), watched_lessons: Math.min(num(watched), num(total) || num(watched)),
    weekly_goal_min: hoursToMinutes(goal), review_every_days: Math.min(365, Math.max(1, num(every, 14))), priority,
  }), onClose)
  return (
    <Modal title={initial ? 'Editar matéria' : 'Nova matéria'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Nome"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Inglês, Azure AZ-900" /></Field>
        <Field label="Área ou trilha" hint="Opcional. Ex.: Idiomas, Certificação."><input className="input" value={area} onChange={(e) => setArea(e.target.value)} /></Field>
        <div role="group" aria-label="Cor">
          <p className="mb-1 text-sm font-medium text-ink2">Cor</p>
          <div className="flex gap-2">
            {SUBJECT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Cor ${c}`} aria-pressed={color === c}
                className="size-8 rounded-full ring-offset-2 ring-offset-sheet aria-pressed:ring-2 aria-pressed:ring-ink" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total de aulas"><input className="input tnum" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value.replace(/\D/g, ''))} placeholder="0" /></Field>
          <Field label="Aulas assistidas"><input className="input tnum" inputMode="numeric" value={watched} onChange={(e) => setWatched(e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Meta semanal (horas)"><input className="input tnum" inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex.: 5" /></Field>
          <Field label="Revisar a cada (dias)"><input className="input tnum" inputMode="numeric" value={every} onChange={(e) => setEvery(e.target.value.replace(/\D/g, ''))} /></Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--ink)]" checked={priority} onChange={(e) => setPriority(e.target.checked)} /> Prioridade do ano
        </label>
        <Actions busy={busy} onCancel={onClose} onDelete={onDelete && (() => run(onDelete))} />
      </form>
    </Modal>
  )
}

export function TaskForm({ initial, subjects, onSave, onDelete, onClose }: FormProps<Task> & { subjects: Subject[] }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [subject, setSubject] = useState<string | null>(initial?.subject_id ?? null)
  const [due, setDue] = useState(initial?.due_on ?? '')
  const [urgent, setUrgent] = useState(initial?.urgent ?? false)
  const { busy, submit, run } = useSubmit(() => onSave({ title: title.trim(), subject_id: subject, due_on: due || null, urgent }), onClose)
  return (
    <Modal title={initial ? 'Editar tarefa' : 'Nova tarefa'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="O que precisa ser feito"><input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Fazer o simulado do módulo 2" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Matéria"><SubjectSelect subjects={subjects} value={subject} onChange={setSubject} /></Field>
          <Field label="Prazo"><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--ink)]" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> Urgente (aparece em Hoje mesmo sem prazo)
        </label>
        <Actions busy={busy} onCancel={onClose} onDelete={onDelete && (() => run(onDelete))} />
      </form>
    </Modal>
  )
}

export function BlockForm({ initial, weekday, subjects, onSave, onDelete, onClose }: FormProps<Block> & { weekday?: number; subjects: Subject[] }) {
  const [day, setDay] = useState(initial?.weekday ?? weekday ?? 0)
  const [time, setTime] = useState(initial ? hhmm(initial.start_time) : '19:00')
  const [minutes, setMinutes] = useState(String(initial?.minutes ?? 60))
  const [subject, setSubject] = useState<string | null>(initial?.subject_id ?? subjects.find((s) => s.priority)?.id ?? null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const { busy, submit, run } = useSubmit(() => onSave({
    weekday: day, start_time: time, minutes: Math.min(720, Math.max(5, num(minutes, 60))), subject_id: subject, title: title.trim() || null,
  }), onClose)
  return (
    <Modal title={initial ? 'Editar bloco' : 'Novo bloco de estudo'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Matéria"><SubjectSelect subjects={subjects} value={subject} onChange={setSubject} none="Sem matéria (bloco livre)" /></Field>
        <Field label="Foco do bloco" hint="Opcional. Ex.: Módulo 3, listening, laboratório."><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Dia"><select className="input" value={day} onChange={(e) => setDay(+e.target.value)}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>
          <Field label="Início"><input className="input tnum" type="time" required value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          <Field label="Minutos"><input className="input tnum" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))} /></Field>
        </div>
        <p className="text-xs text-ink3">O bloco se repete toda semana, neste dia e horário.</p>
        <Actions busy={busy} onCancel={onClose} onDelete={onDelete && (() => run(onDelete))} />
      </form>
    </Modal>
  )
}

export function LinkForm({ initial, subjects, onSave, onDelete, onClose }: FormProps<LinkItem> & { subjects: Subject[] }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [kind, setKind] = useState<LinkKind>(initial?.kind ?? 'link')
  const [subject, setSubject] = useState<string | null>(initial?.subject_id ?? null)
  const [note, setNote] = useState(initial?.note ?? '')
  const { busy, submit, run } = useSubmit(() => {
    const u = url.trim()
    return onSave({ title: title.trim(), url: u ? (/^https?:\/\//i.test(u) ? u : `https://${u}`) : null, kind, subject_id: subject, note: note.trim() || null })
  }, onClose)
  return (
    <Modal title={initial ? 'Editar material' : 'Novo material'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Título"><input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Microsoft Learn, trilha AZ-900" /></Field>
        <Field label="Endereço (URL)" hint="Deixe vazio para livros físicos ou arquivos que só estão no seu computador."><input className="input" inputMode="url" autoCapitalize="none" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="learn.microsoft.com/…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo"><select className="input" value={kind} onChange={(e) => setKind(e.target.value as LinkKind)}>{LINK_KINDS.map((k) => <option key={k} value={k}>{LINK_LABEL[k]}</option>)}</select></Field>
          <Field label="Matéria"><SubjectSelect subjects={subjects} value={subject} onChange={setSubject} /></Field>
        </div>
        <Field label="Anotação"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional" /></Field>
        <Actions busy={busy} onCancel={onClose} onDelete={onDelete && (() => run(onDelete))} />
      </form>
    </Modal>
  )
}

/** Registro manual de tempo estudado (para o que foi feito fora do cronômetro). */
export function LogForm({ subjects, defaultSubject, onSave, onClose }: { subjects: Subject[]; defaultSubject?: string | null; onSave: (v: Partial<StudyLog>) => Promise<boolean>; onClose: () => void }) {
  const [subject, setSubject] = useState<string | null>(defaultSubject ?? subjects.find((s) => s.priority)?.id ?? null)
  const [minutes, setMinutes] = useState('30')
  const [day, setDay] = useState(ymd(new Date()))
  const [note, setNote] = useState('')
  const { busy, submit } = useSubmit(() => onSave({ subject_id: subject, studied_on: day, minutes: Math.min(1440, Math.max(1, num(minutes, 1))), note: note.trim() || null }), onClose)
  return (
    <Modal title="Registrar tempo estudado" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Matéria"><SubjectSelect subjects={subjects} value={subject} onChange={setSubject} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minutos"><input className="input tnum" inputMode="numeric" required value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Dia"><input className="input" type="date" required max={ymd(new Date())} value={day} onChange={(e) => setDay(e.target.value)} /></Field>
        </div>
        <Field label="O que você estudou"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional" /></Field>
        <Actions busy={busy} onCancel={onClose} save="Registrar" />
      </form>
    </Modal>
  )
}
