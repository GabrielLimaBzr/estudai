'use client'
import { useEffect, useState } from 'react'

/** Relógio que se atualiza sozinho. Começa em null (antes de montar) para não divergir do HTML do servidor. */
export function useNow(intervalMs = 20_000): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    const onVisible = () => { if (document.visibilityState === 'visible') setNow(Date.now()) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [intervalMs])
  return now
}
