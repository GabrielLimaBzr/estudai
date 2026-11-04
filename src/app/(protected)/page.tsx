'use client'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Alert } from '@/components/Alert'
import { FocusTimer } from '@/components/FocusTimer'
import { Insights } from '@/components/Insights'
import { Shelf } from '@/components/Shelf'
import { Subjects } from '@/components/Subjects'
import { Today } from '@/components/Today'
import { Week } from '@/components/Week'
import { BlockForm, LinkForm, LogForm, SubjectForm, TaskForm } from '@/components/forms'
import type { Dialog } from '@/components/dialogs'
import { Skeleton } from '@/components/Skeleton'
import { useNow } from '@/hooks/useNow'
import { useStudy } from '@/hooks/useStudy'
import { useTimer } from '@/hooks/useTimer'
import { clockMinutes, ymd } from '@/lib/dates'
import { STARTER_PLAN } from '@/lib/study'

export default function Dashboard() {
  const study = useStudy()
  const api = useTimer()
  const now = useNow(api.timer.status === 'running' ? 1000 : 20_000)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [seeding, setSeeding] = useState(false)
  const close = () => setDialog(null)

  if (now === null || !study.ready) return <Skeleton />

  const date = new Date(now)
  const today = ymd(date)
  const { subjects, tasks, blocks, links, logs } = study
  const empty = subjects.rows.length === 0 && blocks.rows.length === 0

  async function startPlan() {
    setSeeding(true)
    const ids = new Map<string, string>()
    for (const { key, ...s } of STARTER_PLAN.subjects) {
      const row = await subjects.insert(s, 'criar o plano')
      if (!row) { setSeeding(false); return }
      ids.set(key, row.id)
    }
    for (const { key, ...b } of STARTER_PLAN.blocks) await blocks.insert({ ...b, subject_id: ids.get(key) ?? null }, 'criar o plano')
    setSeeding(false)
  }

  return (
    <div className="space-y-12 md:space-y-16">
      {study.error && <Alert action={<button className="underline" onClick={study.clearError}>Dispensar</button>}>{study.error}</Alert>}

      {empty && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-ink3 p-5">
          <Sparkles size={22} className="shrink-0" aria-hidden />
          <p className="min-w-60 flex-1 text-sm text-ink2"><b className="text-ink">Comece pelo plano de 2027.</b> Cria as matérias Inglês e Azure, com metas semanais e blocos de estudo de segunda a domingo. Você ajusta tudo depois.</p>
          <button className="btn" onClick={startPlan} disabled={seeding}>{seeding ? 'Criando…' : 'Criar plano inicial'}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
        <Today study={study} today={today} nowMin={clockMinutes(date)} timer={api} open={setDialog} />
        <FocusTimer study={study} today={today} now={now} api={api} open={setDialog} />
      </div>

      <Week study={study} today={today} open={setDialog} />

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] xl:gap-12">
        <Subjects study={study} today={today} open={setDialog} />
        <Shelf study={study} open={setDialog} />
      </div>

      <Insights study={study} today={today} />

      {dialog?.k === 'subject' && (
        <SubjectForm initial={dialog.item} onClose={close}
          onSave={async (v) => (dialog.item ? subjects.patch(dialog.item.id, v) : !!(await subjects.insert(v)))}
          onDelete={dialog.item && (() => subjects.remove(dialog.item!.id))} />
      )}
      {dialog?.k === 'task' && (
        <TaskForm initial={dialog.item} subjects={subjects.rows} onClose={close}
          onSave={async (v) => (dialog.item ? tasks.patch(dialog.item.id, v) : !!(await tasks.insert(v)))}
          onDelete={dialog.item && (() => tasks.remove(dialog.item!.id))} />
      )}
      {dialog?.k === 'block' && (
        <BlockForm initial={dialog.item} weekday={dialog.weekday} subjects={subjects.rows} onClose={close}
          onSave={async (v) => (dialog.item ? blocks.patch(dialog.item.id, v) : !!(await blocks.insert(v)))}
          onDelete={dialog.item && (() => blocks.remove(dialog.item!.id))} />
      )}
      {dialog?.k === 'link' && (
        <LinkForm initial={dialog.item} subjects={subjects.rows} onClose={close}
          onSave={async (v) => (dialog.item ? links.patch(dialog.item.id, v) : !!(await links.insert(v)))}
          onDelete={dialog.item && (() => links.remove(dialog.item!.id))} />
      )}
      {dialog?.k === 'log' && (
        <LogForm subjects={subjects.rows} defaultSubject={dialog.subject} onClose={close} onSave={async (v) => !!(await logs.insert(v, 'registrar o tempo'))} />
      )}
    </div>
  )
}
