'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Alert } from '@/components/Alert'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useApp } from '@/contexts/app'
import { fmtClock, remainingMs } from '@/lib/timer'

const NAV = [
  { href: '/', label: 'Hoje' },
  { href: '/semana', label: 'Semana' },
  { href: '/materias', label: 'Matérias' },
  { href: '/materiais', label: 'Materiais' },
  { href: '/metas', label: 'Metas' },
]
const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path.startsWith(href))

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="EstudAI, ir para Hoje">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={28} height={28} className="size-7 rounded-md" />
      <span className="font-display text-xl font-semibold tracking-tight">EstudAI</span>
    </Link>
  )
}

/** Enquanto houver uma sessão de foco aberta, mostra o tempo em qualquer tela e leva de volta ao Foco. */
function TimerChip({ compact = false }: { compact?: boolean }) {
  const { timer, now, study } = useApp()
  const t = timer.timer
  if (t.status === 'idle' || now === null) return null
  const subject = study.subjects.rows.find((s) => s.id === t.subjectId)
  const clock = fmtClock(remainingMs(t, now))
  const state = t.status === 'running' ? 'Em foco' : 'Pausado'
  return (
    <Link href="/" aria-label={`${state}, faltam ${clock}${subject ? `, ${subject.name}` : ''}. Voltar ao foco.`}
      className={`block rounded-md border border-rule bg-sheet ${compact ? 'px-2.5 py-1' : 'px-3 py-2.5'}`}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-ink2">{state}</span>
        <span className={`tnum font-display ${compact ? 'text-base' : 'text-xl'} font-medium`}>{clock}</span>
      </span>
      {subject && !compact && <span className="block truncate text-xs text-ink2">{subject.name}</span>}
    </Link>
  )
}

export function AppShell({ email, children }: { email?: string; children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { study } = useApp()

  async function signOut() {
    await createClient().auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-dvh md:flex">
      <a href="#conteudo" className="sr-only z-[60] rounded-md bg-sheet px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Ir para o conteúdo</a>

      {/* Desktop: menu lateral só com texto */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-rule px-6 py-8 md:flex">
        <div className="mb-12"><Brand /></div>
        <nav aria-label="Principal" className="flex-1">
          <ul className="space-y-1">
            {NAV.map(({ href, label }) => {
              const on = isActive(path, href)
              return (
                <li key={href}>
                  <Link href={href} aria-current={on ? 'page' : undefined}
                    className={`-ml-6 block border-l-2 py-2 pl-[22px] text-[15px] transition-colors ${on ? 'border-accent font-semibold text-ink' : 'border-transparent text-ink2 hover:text-ink'}`}>
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="space-y-4">
          <TimerChip />
          <ThemeToggle />
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-ink3" title={email}>{email}</span>
            <button onClick={signOut} className="btn-quiet shrink-0 !px-2">Sair</button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Celular: barra superior simples */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-rule bg-paper/95 px-4 pb-2.5 pt-[calc(0.6rem+env(safe-area-inset-top))] backdrop-blur md:hidden">
          <Brand />
          <div className="flex items-center gap-2"><TimerChip compact /><button onClick={signOut} className="btn-quiet">Sair</button></div>
        </div>
        <main id="conteudo" className="mx-auto w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-7 md:px-12 md:pb-24 md:pt-14">
          {study.error && <div className="mb-6"><Alert action={<button className="underline" onClick={study.clearError}>Dispensar</button>}>{study.error}</Alert></div>}
          {children}
        </main>
      </div>

      {/* Celular: barra inferior */}
      <nav aria-label="Navegação" className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-sheet/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(path, href) ? 'page' : undefined}
                className={`block border-t-2 py-3 text-center text-xs ${isActive(path, href) ? 'border-accent font-semibold text-ink' : 'border-transparent text-ink2'}`}>{label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
