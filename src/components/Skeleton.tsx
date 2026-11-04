/** Esqueleto de carregamento: mantém a forma do painel em vez de um “Carregando…”. */
export function Skeleton() {
  const block = 'animate-pulse rounded-2xl bg-sunk'
  return (
    <div role="status" aria-label="Carregando" className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]"><div className={`${block} h-96`} /><div className={`${block} h-96 rounded-[28px]`} /></div>
      <div className={`${block} h-72`} />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}
