'use client'
import { useState } from 'react'
import { FocusCard, GoalsCard, PlanCard, WeekStrip, sentence, todayPlan } from '@/components/home'
import { Skeleton } from '@/components/Skeleton'
import { useReadyApp } from '@/contexts/app'
import { isoWeek, longDate } from '@/lib/dates'
import { GOAL_YEAR, STARTER_PLAN, yearProgress } from '@/lib/study'

export default function Home() {
  const app = useReadyApp()
  const [seeding, setSeeding] = useState(false)
  if (!app) return <Skeleton />

  const { study } = app
  const { subjects, blocks } = study
  const plan = todayPlan(app)
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

  const week = isoWeek(app.date)
  const year = yearProgress(app.today)

  return (
    <div className="space-y-8">
      <header className="mb-4">
        <h1 className="font-display text-3xl font-normal leading-tight md:text-[2.5rem]">{sentence(longDate(app.date))}</h1>
        <p className="mt-2 text-ink2">
          Semana {week.week} de {week.year}.{year?.kind === 'before' ? ` Faltam ${year.days} ${year.days === 1 ? 'dia' : 'dias'} para ${GOAL_YEAR}.` : ''}
        </p>
      </header>

      {empty && (
        <div className="sheet flex flex-wrap items-center gap-4 p-5">
          <p className="min-w-60 flex-1 text-sm text-ink2"><b className="font-semibold text-ink">Comece pelo plano de 2027.</b> Cria Inglês e Azure com metas semanais e blocos de segunda a domingo. Você ajusta tudo depois.</p>
          <button className="btn" onClick={startPlan} disabled={seeding}>{seeding ? 'Criando…' : 'Criar plano inicial'}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <FocusCard app={app} plan={plan} />
        <PlanCard app={app} plan={plan} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <WeekStrip app={app} />
        <GoalsCard app={app} />
      </div>
    </div>
  )
}
