import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agendaForDay } from '@/lib/agenda'
import { parseDuration, parsePlan, parseRange } from '@/lib/planImport'
import { daysToExam } from '@/lib/study'
import type { Block, PlanSession, StudyLog } from '@/lib/types'

const md = readFileSync(new URL('./fixtures/cgu.md', import.meta.url), 'utf8')

describe('leitor de cronograma (markdown)', () => {
  const plan = parsePlan(md)

  it('lê todas as 38 sessões, em ordem, sem avisos', () => {
    expect(plan.sessions).toHaveLength(38)
    expect(plan.warnings).toEqual([])
    expect(plan.sessions[0]).toMatchObject({ date: '2026-11-05', start_time: '20:00:00', minutes: 120 })
    expect(plan.sessions[2]).toMatchObject({ date: '2026-11-07', start_time: '09:00:00', minutes: 120 })
    expect(plan.sessions.at(-1)).toMatchObject({ date: '2026-12-12', start_time: '09:00:00' })
    const dates = plan.sessions.map((s) => s.date)
    expect(dates).toEqual([...dates].sort())
    expect(new Set(dates).size).toBe(38) // um dia, uma sessão
  })

  it('lê a prova, o título e a meta semanal', () => {
    expect(plan.examDate).toBe('2026-12-13')
    expect(plan.examName).toBe('CGU 2026')
    expect(plan.weeklyGoalMin).toBe(14 * 60)
  })

  it('agrupa em matérias com a carga semanal sugerida', () => {
    expect(plan.subjects.map((s) => [s.name, s.weeklyGoalMin, s.sessions])).toEqual([
      ['P3 — Desenvolvimento de Sistemas', 420, 29],
      ['P2 — Conhecimentos complementares', 240, 4],
      ['P1 — Conhecimentos básicos', 120, 4],
      ['Revisão e discursiva', 60, 1],
    ])
  })

  it('monta o conteúdo como “tema: assunto”', () => {
    expect(plan.sessions[0].topic).toBe('Java: Tipos, variáveis, operadores, controle de fluxo e métodos')
    const revisao = plan.sessions.find((s) => s.date === '2026-12-12')!
    expect(revisao.topic).toBe('Revisão leve, pontos fracos e preparação para a prova')
    expect(revisao.subject).toBe('Revisão e discursiva')
    // “P1/P2 — Revisão” cai em P1
    expect(plan.sessions.find((s) => s.date === '2026-12-11')!.subject).toBe('P1 — Conhecimentos básicos')
  })
})

describe('partes do leitor', () => {
  it('horários e durações', () => {
    expect(parseRange('20h–22h')).toEqual({ start: '20:00:00', minutes: 120 })
    expect(parseRange('09:00–11:30')).toEqual({ start: '09:00:00', minutes: 150 })
    expect(parseRange('9h-10h30')).toEqual({ start: '09:00:00', minutes: 90 })
    expect(parseRange('22h–20h')).toBeNull()
    expect(parseRange('manhã')).toBeNull()
    expect(parseDuration('2h')).toBe(120)
    expect(parseDuration('1h30')).toBe(90)
    expect(parseDuration('15 min')).toBe(15)
  })
  it('avisa e ignora linha com horário inválido; vira o ano em dezembro → janeiro', () => {
    const p = parsePlan('**Período:** 20/12/2026 a 10/01/2027\n| Data | H | D | C |\n|---|---|---|---|\n| 28/12 | 20h–22h | X — a | b |\n| 02/01 | 20h–22h | X — a | c |\n| 03/01 | tarde | X — a | d |')
    expect(p.sessions.map((s) => s.date)).toEqual(['2026-12-28', '2027-01-02'])
    expect(p.warnings).toHaveLength(1)
  })
  it('markdown sem sessões devolve lista vazia', () => {
    expect(parsePlan('# Nada\n\ntexto solto').sessions).toEqual([])
  })
})

describe('agenda do dia e prova', () => {
  const block = { id: 'b1', weekday: 0, start_time: '19:00:00', minutes: 60, subject_id: null, title: null } as Block
  const sess = (id: string, day: string, t: string, done = false) => ({ id, subject_id: null, planned_on: day, start_time: t, minutes: 120, topic: id, done }) as PlanSession
  it('mistura blocos semanais e sessões datadas, por horário', () => {
    const items = agendaForDay('2026-11-09', [block], [sess('s1', '2026-11-09', '20:00:00'), sess('x', '2026-11-10', '20:00:00')], [])
    expect(items.map((i) => i.id)).toEqual(['b:b1', 's:s1']) // 09/11/2026 é segunda
  })
  it('sessão concluída vem marcada; bloco conta pelo registro do dia', () => {
    const logs = [{ id: 'l', block_id: 'b1', plan_session_id: null, studied_on: '2026-11-09', minutes: 60 }] as StudyLog[]
    const items = agendaForDay('2026-11-09', [block], [sess('s1', '2026-11-09', '20:00:00', true)], logs)
    expect(items.map((i) => i.done)).toEqual([true, true])
  })
  it('dias para a prova', () => {
    expect(daysToExam('2026-11-04', '2026-12-13')).toBe(39)
    expect(daysToExam('2026-12-13', '2026-12-13')).toBe(0)
    expect(daysToExam('2026-12-14', '2026-12-13')).toBeNull()
    expect(daysToExam('2026-11-04', null)).toBeNull()
  })
})
