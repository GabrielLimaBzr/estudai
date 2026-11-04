'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Alert } from '@/components/Alert'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MIN_PASSWORD, validateAuth, type AuthFieldErrors, type AuthMode } from '@/lib/authForm'
import { friendlyAuthError } from '@/lib/errors'

const COPY = {
  in: { title: 'Entre para abrir o seu painel', button: 'Entrar', busy: 'Entrando…' },
  up: { title: 'Crie a sua conta de estudos', button: 'Criar conta', busy: 'Criando conta…' },
} as const

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink2">{label}</label>
      {children}
      {error ? <p id={`${id}-msg`} className="mt-1 text-sm text-bad" role="alert">{error}</p>
        : hint ? <p id={`${id}-msg`} className="mt-1 text-xs text-ink3">{hint}</p> : null}
    </div>
  )
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-16">
      <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))]"><ThemeToggle /></div>
      <main className="sheet w-full max-w-sm space-y-5 p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-float)' }}>{children}</main>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null) // cadastro feito, falta confirmar o e-mail

  function switchMode(next: AuthMode) { setMode(next); setFieldErrors({}); setFormError(null); setConfirm('') }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setFormError(null)
    const errs = validateAuth(mode, { email, password, confirm })
    setFieldErrors(errs)
    if (Object.keys(errs).length) { document.getElementById(errs.email ? 'email' : errs.password ? 'password' : 'confirm')?.focus(); return }
    setBusy(true)
    const auth = createClient().auth
    const addr = email.trim()
    try {
      if (mode === 'in') {
        const { error } = await auth.signInWithPassword({ email: addr, password })
        if (error) return setFormError(friendlyAuthError(error))
        router.replace('/'); router.refresh()
        return
      }
      const { data, error } = await auth.signUp({ email: addr, password })
      if (error) return setFormError(friendlyAuthError(error))
      if (data.user && data.user.identities?.length === 0) return setFormError(friendlyAuthError({ error_code: 'user_already_exists' }))
      if (data.session) { router.replace('/'); router.refresh(); return }
      setSentTo(addr)
    } catch (err) {
      setFormError(friendlyAuthError(err as Error))
    } finally {
      setBusy(false)
    }
  }

  const bad = (k: keyof AuthFieldErrors) => (fieldErrors[k] ? 'border-bad' : '')

  if (sentTo) {
    return (
      <AuthShell>
        <div className="space-y-3 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-md bg-accent text-on-accent"><MailCheck size={28} aria-hidden /></span>
          <h1 className="font-display text-2xl">Confirme o seu e-mail</h1>
          <p className="text-sm text-ink2">Enviamos um link para <b className="text-ink">{sentTo}</b>. Abra o e-mail, toque no link e volte aqui para entrar. Se não achar, veja o spam.</p>
        </div>
        <button className="btn w-full" onClick={() => { setSentTo(null); switchMode('in'); setPassword('') }}>Já confirmei, entrar</button>
      </AuthShell>
    )
  }

  const t = COPY[mode]
  return (
    <AuthShell>
      <header className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={40} height={40} className="size-10 rounded-xl" />
        <div><h1 className="font-display text-2xl font-semibold leading-tight">EstudAI</h1><p className="text-sm text-ink2">{t.title}</p></div>
      </header>

      <div className="seg grid grid-cols-2" role="tablist" aria-label="Entrar ou criar conta">
        {(['in', 'up'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}>{COPY[m].button}</button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <Field id="email" label="E-mail" error={fieldErrors.email}>
          <input id="email" className={`input ${bad('email')}`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoFocus
            placeholder="nome@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? 'email-msg' : undefined} />
        </Field>
        <Field id="password" label="Senha" error={fieldErrors.password} hint={mode === 'up' ? `Pelo menos ${MIN_PASSWORD} caracteres.` : undefined}>
          <div className="relative">
            <input id="password" className={`input pr-11 ${bad('password')}`} type={show ? 'text' : 'password'} autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password || mode === 'up' ? 'password-msg' : undefined} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={show}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink3 hover:text-ink">
              {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </Field>
        {mode === 'up' && (
          <Field id="confirm" label="Confirmar senha" error={fieldErrors.confirm}>
            <input id="confirm" className={`input ${bad('confirm')}`} type={show ? 'text' : 'password'} autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!fieldErrors.confirm} aria-describedby={fieldErrors.confirm ? 'confirm-msg' : undefined} />
          </Field>
        )}
        <button className="btn w-full py-2.5 text-base" type="submit" disabled={busy}>
          {busy ? <><Loader2 size={18} className="animate-spin" aria-hidden /> {t.busy}</> : t.button}
        </button>
      </form>
    </AuthShell>
  )
}
