'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
type Mode = 'light' | 'dark'
const KEY = 'estudai:theme'
const META = { dark: '#0d1219', light: '#f6f7f9' } as const

const Ctx = createContext<{ pref: ThemePref; setPref: (p: ThemePref) => void }>({ pref: 'system', setPref: () => {} })
export const useTheme = () => useContext(Ctx)

const systemMode = (): Mode => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
const resolve = (p: ThemePref): Mode => (p === 'system' ? systemMode() : p)

/** Roda antes da pintura: define o tema do <html> sem “piscar” o tema errado. */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${KEY}')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='dark'}})()`

/** Tema claro / escuro / automático (segue o computador). Todas as cores são variáveis CSS, então basta trocar o atributo. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('system')

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v) } catch { /* sem storage */ }
  }, [])

  useEffect(() => {
    const apply = () => {
      const r = resolve(pref)
      document.documentElement.dataset.theme = r
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', META[r]))
    }
    apply()
    if (pref !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p)
    try { localStorage.setItem(KEY, p) } catch { /* sem storage */ }
  }, [])

  return <Ctx.Provider value={{ pref, setPref }}>{children}</Ctx.Provider>
}
