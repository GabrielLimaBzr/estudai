'use client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useNow } from '@/hooks/useNow'
import { GOAL_YEAR, yearProgress } from '@/lib/study'
import { ymd } from '@/lib/dates'

const SECTIONS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'materias', label: 'Matérias' },
  { id: 'materiais', label: 'Materiais' },
  { id: 'insights', label: 'Metas' },
]

export function Header({ email }: { email?: string }) {
  const router = useRouter()
  const now = useNow(60_000)
  const year = now === null ? null : yearProgress(ymd(new Date(now)))

  async function signOut() {
    await createClient().auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-x-5 gap-y-2 px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] md:px-8">
        <a href="#conteudo" className="flex shrink-0 items-center gap-2.5" aria-label="EstudAI">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={30} height={30} className="size-[30px] rounded-lg" />
          <span className="font-display text-lg font-semibold tracking-tight">EstudAI</span>
        </a>

        <nav aria-label="Seções" className="hidden flex-1 gap-0.5 md:flex">
          {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink2 transition-colors hover:bg-sunk hover:text-ink">{s.label}</a>)}
        </nav>
        <span className="flex-1 md:hidden" />

        {year && (
          <span className="chip tnum hidden sm:inline-flex" title={`Meta do ano: Inglês e certificação Azure`}>
            {year.kind === 'before' ? `${year.days} ${year.days === 1 ? 'dia' : 'dias'} para ${GOAL_YEAR}` : `Dia ${year.day} de ${year.of} em ${GOAL_YEAR}`}
          </span>
        )}
        <ThemeToggle />
        <button onClick={signOut} className="btn-quiet" title={email} aria-label={`Sair${email ? ` (${email})` : ''}`}><LogOut size={16} aria-hidden /><span className="hidden lg:inline">Sair</span></button>
      </div>
    </header>
  )
}
