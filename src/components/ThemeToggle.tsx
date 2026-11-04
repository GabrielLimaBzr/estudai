'use client'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePref } from '@/contexts/theme'

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Escuro', Icon: Moon },
  { value: 'system', label: 'Automático, segue o computador', Icon: Monitor },
]

/** Tema claro, escuro ou automático. Compacto: só ícones, com rótulo para leitores de tela. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { pref, setPref } = useTheme()
  return (
    <div className={`seg ${className}`} role="group" aria-label="Aparência">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button key={value} type="button" aria-pressed={pref === value} onClick={() => setPref(value)} title={label} aria-label={label} className="grid place-items-center px-2.5">
          <Icon size={15} aria-hidden />
        </button>
      ))}
    </div>
  )
}
