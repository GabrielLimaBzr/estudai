'use client'
import { useMemo, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { Alert } from '@/components/Alert'
import { Modal, SUBJECT_COLORS } from '@/components/ui'
import type { Study } from '@/hooks/useStudy'
import { fmtDuration, parseYmd, shortDay } from '@/lib/dates'
import { parsePlan } from '@/lib/planImport'

/** Importa um cronograma em markdown (colado ou de um arquivo .md): cria matérias, sessões datadas e a prova. */
export function ImportPlan({ study, onClose }: { study: Study; onClose: () => void }) {
  const [text, setText] = useState('')
  const [replace, setReplace] = useState(true)
  const [dropBlocks, setDropBlocks] = useState(false)
  const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const plan = useMemo(() => (text.trim() ? parsePlan(text) : null), [text])
  const { sessions, subjects, blocks } = study
  const okPlan = plan && plan.sessions.length > 0 ? plan : null

  async function readFile(f: File | undefined) {
    if (f) setText(await f.text())
  }

  async function run() {
    if (!okPlan) return
    setBusy(true)
    try {
      if (replace && !(await sessions.removeMany(sessions.rows.map((s) => s.id), 'substituir o cronograma'))) return
      if (dropBlocks && !(await blocks.removeMany(blocks.rows.map((b) => b.id), 'remover os blocos semanais'))) return

      // matérias: reaproveita as de mesmo nome; as novas ganham uma cor cada
      const ids = new Map<string, string>()
      let colorIdx = subjects.rows.length
      for (const ps of okPlan.subjects) {
        const existing = subjects.rows.find((s) => s.name.toLowerCase() === ps.name.toLowerCase())
        const change = { total_lessons: ps.sessions, watched_lessons: 0, weekly_goal_min: ps.weeklyGoalMin || existing?.weekly_goal_min || 0 }
        if (existing) {
          if (!(await subjects.patch(existing.id, change, 'atualizar a matéria'))) return
          ids.set(ps.name, existing.id)
        } else {
          const row = await subjects.insert({ name: ps.name, area: okPlan.examName, color: SUBJECT_COLORS[colorIdx++ % SUBJECT_COLORS.length], review_every_days: 7, priority: true, ...change }, 'criar a matéria')
          if (!row) return
          ids.set(ps.name, row.id)
        }
      }

      const rows = okPlan.sessions.map((s) => ({ subject_id: ids.get(s.subject) ?? null, planned_on: s.date, start_time: s.start_time, minutes: s.minutes, topic: s.topic, done: false }))
      if (!(await sessions.insertMany(rows, 'importar as sessões'))) return

      const saved = await study.saveSettings({
        ...(okPlan.examDate ? { exam_date: okPlan.examDate, exam_name: okPlan.examName } : {}),
        ...(okPlan.weeklyGoalMin ? { weekly_goal_min: okPlan.weeklyGoalMin } : {}),
      })
      if (saved) onClose()
    } finally {
      setBusy(false)
    }
  }

  const first = okPlan?.sessions[0], last = okPlan?.sessions.at(-1)
  return (
    <Modal title="Importar cronograma" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-sm text-ink2">Cole o cronograma em markdown (as tabelas com data, horário, disciplina e conteúdo) ou escolha o arquivo <code>.md</code>.</p>
        <div className="flex items-center gap-2">
          <input ref={file} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} aria-label="Escolher arquivo markdown" />
          <button type="button" className="btn-ghost" onClick={() => file.current?.click()}><FileUp size={15} aria-hidden /> Escolher arquivo</button>
        </div>
        <label className="block">
          <span className="sr-only">Cronograma em markdown</span>
          <textarea className="input min-h-44 font-mono !text-xs" value={text} onChange={(e) => setText(e.target.value)} placeholder="| Data | Horário | Disciplina | Conteúdo |&#10;|---|---|---|---|&#10;| 05/11 (qui.) | 20h–22h | P3 — Java | Tipos, variáveis… |" spellCheck={false} />
        </label>

        {plan && !okPlan && <Alert>Não encontrei nenhuma sessão. Confira se as linhas têm o formato “| 05/11 | 20h–22h | Disciplina | Conteúdo |”.</Alert>}

        {okPlan && first && last && (
          <div className="rounded-md border border-rule p-4 text-sm">
            <p className="font-medium"><span className="tnum">{okPlan.sessions.length}</span> sessões, de {shortDay(parseYmd(first.date))} a {shortDay(parseYmd(last.date))}</p>
            <ul className="mt-2 space-y-0.5 text-ink2">
              {okPlan.subjects.map((s) => (
                <li key={s.name} className="tnum">{s.name}: {s.sessions} {s.sessions === 1 ? 'sessão' : 'sessões'}{s.weeklyGoalMin ? `, meta de ${fmtDuration(s.weeklyGoalMin)} por semana` : ''}</li>
              ))}
            </ul>
            {okPlan.examDate && <p className="mt-2 text-ink2">Prova em {shortDay(parseYmd(okPlan.examDate))} de {parseYmd(okPlan.examDate).getFullYear()}{okPlan.examName ? ` (${okPlan.examName})` : ''}.</p>}
            {okPlan.weeklyGoalMin && <p className="text-ink2">Meta semanal total: {fmtDuration(okPlan.weeklyGoalMin)}.</p>}
            {okPlan.warnings.length > 0 && <p className="mt-2 text-warn">{okPlan.warnings.length} {okPlan.warnings.length === 1 ? 'linha ignorada' : 'linhas ignoradas'}: {okPlan.warnings[0]}</p>}
          </div>
        )}

        {okPlan && (sessions.rows.length > 0 || blocks.rows.length > 0) && (
          <div className="space-y-2 text-sm">
            {sessions.rows.length > 0 && <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" className="size-4 accent-[var(--accent)]" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Substituir as {sessions.rows.length} sessões do cronograma atual</label>}
            {blocks.rows.length > 0 && <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" className="size-4 accent-[var(--accent)]" checked={dropBlocks} onChange={(e) => setDropBlocks(e.target.checked)} /> Remover também os {blocks.rows.length} blocos semanais fixos (para não aparecerem junto)</label>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn" disabled={!okPlan || busy} onClick={run}>{busy ? 'Importando…' : okPlan ? `Importar ${okPlan.sessions.length} sessões` : 'Importar'}</button>
        </div>
      </div>
    </Modal>
  )
}
