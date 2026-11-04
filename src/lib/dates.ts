// Datas sempre no fuso local, como 'AAAA-MM-DD' (nunca toISOString, que vira UTC e erra o dia à noite).
export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const
export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseYmd = (s: string) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (d: Date, n: number) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x }
/** 0 = segunda … 6 = domingo. */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7
export const weekStart = (d: Date) => addDays(d, -weekdayIndex(d))
export const weekDays = (d: Date): string[] => Array.from({ length: 7 }, (_, i) => ymd(addDays(weekStart(d), i)))
/** Dias de `a` até `b` (positivo se b é depois de a). */
export const daysBetween = (a: string, b: string) => Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86_400_000)

/** Semana ISO (1–53) e o ano a que ela pertence. */
export function isoWeek(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const year = t.getUTCFullYear()
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7)
  return { year, week }
}
export const weekKey = (d: Date) => { const { year, week } = isoWeek(d); return `${year}-W${pad(week)}` }

/** '19:30' (ou '19:30:00') → minutos desde a meia-noite. */
export const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0) }
export const hhmm = (t: string) => t.slice(0, 5)
export const clockMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes()

/** 45 → '45 min'; 90 → '1h30'; 120 → '2h'. */
export function fmtDuration(min: number): string {
  const m = Math.max(0, Math.round(min))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h}h${pad(r)}` : `${h}h`
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', opts)
export const longDate = (d: Date) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d)
export const shortDay = (d: Date) => fmt({ day: 'numeric', month: 'short' }).format(d).replace('.', '')
export const monthName = (d: Date) => fmt({ month: 'long' }).format(d)
