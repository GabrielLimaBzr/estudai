import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, fmtDuration, isoWeek, parseYmd, weekDays, weekdayIndex, weekStart, ymd } from '@/lib/dates'
import { blockMinutesDone, minutesByDay, nowPointer, progressPct, quoteOfWeek, reviewStatus, streak, urgentTasks, yearProgress } from '@/lib/study'
import { IDLE_TIMER, elapsedMs, fmtClock, isFinished, minutesToLog, pause, remainingMs, start } from '@/lib/timer'
import type { Block, StudyLog, Task } from '@/lib/types'

const log = (day: string, minutes: number, block_id: string | null = null): StudyLog => ({ id: day + minutes, subject_id: null, block_id, studied_on: day, minutes, note: null })

describe('datas', () => {
  it('semana começa na segunda', () => {
    const wed = parseYmd('2026-11-04') // quarta
    expect(weekdayIndex(wed)).toBe(2)
    expect(ymd(weekStart(wed))).toBe('2026-11-02')
    expect(weekDays(wed)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(weekdayIndex(parseYmd('2026-11-08'))).toBe(6) // domingo
  })
  it('ymd usa o dia local e addDays cruza mês e ano', () => {
    expect(ymd(addDays(parseYmd('2026-12-31'), 1))).toBe('2027-01-01')
    expect(daysBetween('2026-11-04', '2027-01-01')).toBe(58)
  })
  it('semana ISO', () => {
    expect(isoWeek(parseYmd('2027-01-01'))).toEqual({ year: 2026, week: 53 })
    expect(isoWeek(parseYmd('2026-11-04')).week).toBe(45)
  })
  it('formata duração', () => {
    expect(fmtDuration(45)).toBe('45 min')
    expect(fmtDuration(60)).toBe('1h')
    expect(fmtDuration(90)).toBe('1h30')
    expect(fmtDuration(125)).toBe('2h05')
  })
})

describe('progresso e revisão', () => {
  it('percentual limitado a 0–100', () => {
    expect(progressPct(0, 0)).toBe(0)
    expect(progressPct(12, 40)).toBe(30)
    expect(progressPct(50, 40)).toBe(100)
  })
  const base = { watched_lessons: 5, review_every_days: 7 }
  it('revisão espaçada', () => {
    expect(reviewStatus({ ...base, watched_lessons: 0, last_reviewed_on: null }, '2026-11-04').kind).toBe('idle')
    expect(reviewStatus({ ...base, last_reviewed_on: null }, '2026-11-04').kind).toBe('never')
    expect(reviewStatus({ ...base, last_reviewed_on: '2026-10-20' }, '2026-11-04')).toEqual({ kind: 'late', label: 'Atrasada há 8 dias' })
    expect(reviewStatus({ ...base, last_reviewed_on: '2026-10-28' }, '2026-11-04')).toEqual({ kind: 'soon', label: 'Revisar hoje' })
    expect(reviewStatus({ ...base, last_reviewed_on: '2026-10-30' }, '2026-11-04')).toEqual({ kind: 'soon', label: 'Revisar em 2 dias' })
    expect(reviewStatus({ ...base, last_reviewed_on: '2026-11-03' }, '2026-11-04').kind).toBe('ok')
  })
})

describe('registros', () => {
  it('minutos por dia e sequência', () => {
    const logs = [log('2026-11-02', 30), log('2026-11-02', 20), log('2026-11-03', 60), log('2026-11-04', 10)]
    expect(minutesByDay(logs, ['2026-11-02', '2026-11-03', '2026-11-05'])).toEqual([50, 60, 0])
    expect(streak(logs, '2026-11-04')).toBe(3)
    expect(streak(logs, '2026-11-05')).toBe(3) // hoje ainda sem estudo: a sequência de ontem vale
    expect(streak(logs, '2026-11-06')).toBe(0)
    expect(streak([], '2026-11-04')).toBe(0)
  })
  it('bloco feito só na data do registro', () => {
    const b = { id: 'b1' } as Block
    expect(blockMinutesDone(b, '2026-11-04', [log('2026-11-04', 60, 'b1'), log('2026-11-03', 60, 'b1')])).toBe(60)
  })
  it('bloco atual e próximo', () => {
    const mk = (id: string, t: string, m: number) => ({ id, start_time: t, minutes: m }) as Block
    const bs = [mk('a', '09:00:00', 60), mk('b', '19:00:00', 60), mk('c', '21:00:00', 30)]
    expect(nowPointer(bs, 9 * 60 + 30, () => false)).toEqual({ current: 'a', next: 'b' })
    expect(nowPointer(bs, 12 * 60, () => false)).toEqual({ current: null, next: 'b' })
    expect(nowPointer(bs, 19 * 60 + 10, (b) => b.id === 'b')).toEqual({ current: null, next: 'c' })
  })
})

describe('tarefas e ano', () => {
  const t = (id: string, o: Partial<Task>): Task => ({ id, title: id, subject_id: null, due_on: null, urgent: false, done: false, ...o })
  it('urgentes: atrasadas primeiro, ignora concluídas e futuras', () => {
    const out = urgentTasks([
      t('futura', { due_on: '2026-11-10' }), t('hoje', { due_on: '2026-11-04' }), t('atrasada', { due_on: '2026-11-01' }),
      t('urgente', { urgent: true }), t('feita', { urgent: true, done: true }),
    ], '2026-11-04')
    expect(out.map((x) => x.id)).toEqual(['atrasada', 'hoje', 'urgente'])
  })
  it('contagem para 2027', () => {
    expect(yearProgress('2026-11-04')).toEqual({ kind: 'before', days: 58 })
    expect(yearProgress('2027-01-01')).toEqual({ kind: 'during', day: 1, of: 365 })
    expect(yearProgress('2028-01-01')).toBeNull()
  })
  it('frase da semana é estável na semana e muda na seguinte', () => {
    expect(quoteOfWeek(parseYmd('2026-11-02'))).toBe(quoteOfWeek(parseYmd('2026-11-08')))
    expect(quoteOfWeek(parseYmd('2026-11-02'))).not.toBe(quoteOfWeek(parseYmd('2026-11-09')))
  })
})

describe('cronômetro', () => {
  const t0 = 1_000_000
  it('conta, pausa e termina', () => {
    const run = start({ ...IDLE_TIMER, durationMin: 25 }, t0)
    expect(remainingMs(run, t0 + 60_000)).toBe(24 * 60_000)
    const paused = pause(run, t0 + 5 * 60_000)
    expect(elapsedMs(paused, t0 + 99 * 60_000)).toBe(5 * 60_000) // pausado não corre
    const again = start(paused, t0 + 10 * 60_000)
    expect(elapsedMs(again, t0 + 12 * 60_000)).toBe(7 * 60_000)
    expect(isFinished(run, t0 + 25 * 60_000)).toBe(true)
    expect(isFinished(IDLE_TIMER, t0)).toBe(false)
  })
  it('minutos a registrar: arredonda, mínimo 1, máximo a duração', () => {
    const run = start({ ...IDLE_TIMER, durationMin: 25 }, t0)
    expect(minutesToLog(run, t0 + 10_000)).toBe(1)
    expect(minutesToLog(run, t0 + 12.4 * 60_000)).toBe(12)
    expect(minutesToLog(run, t0 + 90 * 60_000)).toBe(25)
  })
  it('relógio mm:ss', () => {
    expect(fmtClock(25 * 60_000)).toBe('25:00')
    expect(fmtClock(1)).toBe('00:01')
    expect(fmtClock(0)).toBe('00:00')
  })
})
