/** Esqueleto de carregamento: mantém a forma da página em vez de um “Carregando…”. */
export function Skeleton() {
  const block = 'animate-pulse rounded-lg bg-sunk'
  return (
    <div role="status" aria-label="Carregando" className="space-y-8">
      <div className={`${block} h-12 w-72`} />
      <div className="grid gap-6 lg:grid-cols-2"><div className={`${block} h-[28rem]`} /><div className={`${block} h-[28rem]`} /></div>
      <span className="sr-only">Carregando…</span>
    </div>
  )
}
