'use client'
import { useTheme, type ThemePref } from '@/contexts/theme'

const OPTIONS: { value: ThemePref; label: string; title: string }[] = [
  { value: 'light', label: 'Claro', title: 'Tema claro' },
  { value: 'dark', label: 'Escuro', title: 'Tema escuro' },
  { value: 'system', label: 'Auto', title: 'Automático: segue o tema do computador' },
]

/** Tema claro, escuro ou automático. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { pref, setPref } = useTheme()
  return (
    <div className={`seg w-full ${className}`} role="group" aria-label="Aparência">
      {OPTIONS.map(({ value, label, title }) => (
        <button key={value} type="button" aria-pressed={pref === value} onClick={() => setPref(value)} title={title} className="flex-1 px-1.5 text-xs">{label}</button>
      ))}
    </div>
  )
}
