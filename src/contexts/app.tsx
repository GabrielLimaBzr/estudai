'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { BlockForm, LinkForm, LogForm, SessionForm, SubjectForm, TaskForm } from '@/components/forms'
import { ImportPlan } from '@/components/ImportPlan'
import type { Dialog, OpenDialog } from '@/components/dialogs'
import { useNow } from '@/hooks/useNow'
import { useStudy, type Study } from '@/hooks/useStudy'
import { useTimer, type TimerApi } from '@/hooks/useTimer'
import { clockMinutes, ymd } from '@/lib/dates'
import { fmtClock, isFinished, remainingMs } from '@/lib/timer'

interface AppCtx { study: Study; timer: TimerApi; now: number | null; open: OpenDialog }
const Ctx = createContext<AppCtx | null>(null)

/** Dados, relógio e cronômetro vivem aqui, acima das páginas: trocar de tela não interrompe uma sessão de foco. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const study = useStudy()
  const timer = useTimer()
  const t = timer.timer
  const now = useNow(t.status === 'running' ? 1000 : 20_000)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const close = () => setDialog(null)

  // ao chegar em zero o cronômetro congela (não registra sozinho: quem decide é você)
  const { pause } = timer
  useEffect(() => { if (now !== null && t.status === 'running' && isFinished(t, now)) pause() }, [now, t, pause])

  // o tempo restante aparece na aba do navegador, para acompanhar de outra janela
  useEffect(() => {
    if (now === null || t.status === 'idle') return
    document.title = isFinished(t, now) ? 'Tempo! · EstudAI' : `${fmtClock(remainingMs(t, now))} · EstudAI`
    return () => { document.title = 'EstudAI' }
  }, [now, t])

  const { subjects, tasks, blocks, links, logs, sessions } = study
  return (
    <Ctx.Provider value={{ study, timer, now, open: setDialog }}>
      {children}
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
      {dialog?.k === 'session' && (
        <SessionForm initial={dialog.item} subjects={subjects.rows} onClose={close}
          onSave={(v) => sessions.patch(dialog.item.id, v)}
          onDelete={() => sessions.remove(dialog.item.id)} />
      )}
      {dialog?.k === 'import' && <ImportPlan study={study} onClose={close} />}
      {dialog?.k === 'log' && (
        <LogForm subjects={subjects.rows} defaultSubject={dialog.subject} onClose={close} onSave={async (v) => !!(await logs.insert(v, 'registrar o tempo'))} />
      )}
    </Ctx.Provider>
  )
}

export function useApp(): AppCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fora do AppProvider')
  return c
}

export interface ReadyApp extends Omit<AppCtx, 'now'> { now: number; date: Date; today: string; nowMin: number }

/** O app já com dados e relógio carregados; `null` enquanto carrega (a página mostra o esqueleto). */
export function useReadyApp(): ReadyApp | null {
  const c = useApp()
  if (c.now === null || !c.study.ready) return null
  const date = new Date(c.now)
  return { ...c, now: c.now, date, today: ymd(date), nowMin: clockMinutes(date) }
}
