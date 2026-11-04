'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { friendlyError } from '@/lib/errors'
import { addDays, ymd } from '@/lib/dates'
import { DEFAULT_SETTINGS, type Block, type LinkItem, type PlanSession, type Settings, type StudyLog, type Subject, type Task } from '@/lib/types'

type Row = { id: string }

/** Uma tabela do Supabase como lista local + operações. Nunca lança: erros viram mensagem em `fail`. */
function useTable<T extends Row>(table: string, fail: (msg: string) => void, since?: { col: string; value: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<T[]>([])
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    let q = supabase.from(table).select('*')
    if (since) q = q.gte(since.col, since.value)
    const { data, error } = await q
    if (error) fail(friendlyError(error, 'carregar os dados'))
    else setRows((data as T[]) ?? [])
    setReady(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const insert = useCallback(async (row: Partial<T>, action = 'salvar'): Promise<T | null> => {
    const { data, error } = await supabase.from(table).insert(row as never).select().single()
    if (error) { fail(friendlyError(error, action)); return null }
    setRows((p) => [...p, data as T])
    return data as T
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** Vários de uma vez (uma só ida ao servidor). */
  const insertMany = useCallback(async (list: Partial<T>[], action = 'salvar'): Promise<T[] | null> => {
    if (list.length === 0) return []
    const { data, error } = await supabase.from(table).insert(list as never).select()
    if (error) { fail(friendlyError(error, action)); return null }
    setRows((p) => [...p, ...(data as T[])])
    return data as T[]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const removeMany = useCallback(async (ids: string[], action = 'excluir'): Promise<boolean> => {
    if (ids.length === 0) return true
    const { error } = await supabase.from(table).delete().in('id', ids)
    if (error) { fail(friendlyError(error, action)); return false }
    const gone = new Set(ids)
    setRows((p) => p.filter((r) => !gone.has(r.id)))
    return true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback(async (id: string, change: Partial<T>, action = 'salvar'): Promise<boolean> => {
    const { data, error } = await supabase.from(table).update(change as never).eq('id', id).select().single()
    if (error) { fail(friendlyError(error, action)); return false }
    setRows((p) => p.map((r) => (r.id === id ? (data as T) : r)))
    return true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = useCallback(async (id: string, action = 'excluir'): Promise<boolean> => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { fail(friendlyError(error, action)); return false }
    setRows((p) => p.filter((r) => r.id !== id))
    return true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { rows, ready, insert, insertMany, patch, remove, removeMany, setRows }
}

/** Todos os dados do painel. Os registros de estudo cobrem ~14 meses, o bastante para semana, mês, ano e sequência. */
export function useStudy() {
  const supabase = useMemo(() => createClient(), [])
  const [error, setError] = useState<string | null>(null)
  const fail = useCallback((m: string) => setError(m), [])
  const since = useRef({ col: 'studied_on', value: ymd(addDays(new Date(), -430)) }).current

  const subjects = useTable<Subject>('subjects', fail)
  const tasks = useTable<Task>('tasks', fail)
  const blocks = useTable<Block>('blocks', fail)
  const logs = useTable<StudyLog>('study_log', fail, since)
  const links = useTable<LinkItem>('links', fail)
  const sessions = useTable<PlanSession>('plan_sessions', fail)

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [settingsReady, setSettingsReady] = useState(false)
  useEffect(() => {
    supabase.from('settings').select('weekly_goal_min,quote,quote_week,exam_name,exam_date').maybeSingle().then(({ data, error: e }) => {
      if (e) setError(friendlyError(e, 'carregar as metas'))
      else if (data) setSettings(data as Settings)
      setSettingsReady(true)
    })
  }, [supabase])

  const saveSettings = useCallback(async (change: Partial<Settings>): Promise<boolean> => {
    const next = { ...settings, ...change }
    const { error: e } = await supabase.from('settings').upsert(next, { onConflict: 'user_id' })
    if (e) { setError(friendlyError(e, 'salvar as metas')); return false }
    setSettings(next)
    return true
  }, [settings, supabase])

  const ready = subjects.ready && tasks.ready && blocks.ready && logs.ready && links.ready && sessions.ready && settingsReady
  return { subjects, tasks, blocks, logs, links, sessions, settings, saveSettings, ready, error, clearError: () => setError(null) }
}
export type Study = ReturnType<typeof useStudy>
