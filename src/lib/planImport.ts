/** Lê um cronograma em markdown (tabelas) e devolve sessões datadas, matérias e a prova. Não fala com o banco. */
export interface ParsedSession { date: string; start_time: string; minutes: number; subject: string; topic: string }
export interface ParsedSubject { name: string; weeklyGoalMin: number; sessions: number }
export interface ParsedPlan {
  title: string | null
  examName: string | null
  examDate: string | null
  weeklyGoalMin: number | null
  subjects: ParsedSubject[]
  sessions: ParsedSession[]
  warnings: string[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const clean = (s: string) => s.replace(/\*\*|__|`/g, '').trim()
const cellsOf = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(clean)

function validYmd(y: number, m: number, d: number): string | null {
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null
}

/** '2h' → 120 · '1h30' → 90 · '45 min' → 45. */
export function parseDuration(s: string): number | null {
  const h = s.match(/(\d+)\s*h\s*(\d+)?/i)
  if (h) return +h[1] * 60 + (h[2] ? +h[2] : 0)
  const m = s.match(/(\d+)\s*min/i)
  return m ? +m[1] : null
}

/** '20h–22h' · '20:00-22:00' · '9h–11h30' → início e duração em minutos. */
export function parseRange(s: string): { start: string; minutes: number } | null {
  const m = s.match(/(\d{1,2})(?:[h:](\d{2})?)?\s*[–—-]\s*(\d{1,2})(?:[h:](\d{2})?)?/)
  if (!m) return null
  const a = +m[1] * 60 + (m[2] ? +m[2] : 0)
  const b = +m[3] * 60 + (m[4] ? +m[4] : 0)
  if (m[1].length > 2 || +m[1] > 23 || +m[3] > 24 || b <= a) return null
  return { start: `${pad(Math.floor(a / 60))}:${pad(a % 60)}:00`, minutes: b - a }
}

interface Area { code: string; name: string; weeklyMin: number }

export function parsePlan(markdown: string, fallbackYear = new Date().getFullYear()): ParsedPlan {
  const lines = markdown.split(/\r?\n/)
  const warnings: string[] = []
  let title: string | null = null
  let examDate: string | null = null
  let weeklyGoalMin: number | null = null
  let startYear = fallbackYear, startMonth = 1

  for (const raw of lines) {
    const line = clean(raw)
    if (!title) { const h = line.match(/^#\s+(.+)/); if (h) title = h[1].trim() }
    const per = line.match(/^per[ií]odo\s*:.*?(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(?:a|até|-|–)\s*\d{1,2}\/\d{1,2}\/\d{4}/i)
    if (per) { startMonth = +per[2]; startYear = +per[3] }
    const ex = line.match(/^prova\s*:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i)
    if (ex) examDate = validYmd(+ex[3], +ex[2], +ex[1])
    const wk = line.match(/^carga hor[aá]ria semanal\s*:\s*(\d+)\s*h/i)
    if (wk) weeklyGoalMin = +wk[1] * 60
  }

  // tabela de distribuição: P1 | Conhecimentos básicos | 2h …
  const areas: Area[] = []
  for (const raw of lines) {
    if (!raw.trim().startsWith('|')) continue
    const c = cellsOf(raw)
    if (c.length < 3 || !(/^p\d+$/i.test(c[0]) || /^revis/i.test(c[0]))) continue
    const weeklyMin = parseDuration(c[2])
    if (weeklyMin === null) continue
    const code = c[0]
    areas.push({ code, weeklyMin, name: /^p\d+$/i.test(code) ? `${code.toUpperCase()} — ${c[1]}` : code.replace(/\s*\/\s*/g, ' e ') })
  }

  const findArea = (head: string): Area | null => {
    const first = head.split('/')[0].trim().toLowerCase()
    return areas.find((a) => a.code.toLowerCase() === first) ?? (/^revis/i.test(head) ? areas.find((a) => /^revis/i.test(a.code)) ?? null : null)
  }

  const sessions: ParsedSession[] = []
  for (const raw of lines) {
    if (!raw.trim().startsWith('|')) continue
    const c = cellsOf(raw)
    const d = c[0]?.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
    if (!d || c.length < 3) continue
    const month = +d[2]
    const year = d[3] ? +d[3] : month < startMonth ? startYear + 1 : startYear
    const date = validYmd(year, month, +d[1])
    const range = parseRange(c[1] ?? '')
    if (!date || !range) { warnings.push(`Linha ignorada (data ou horário inválido): ${c.slice(0, 2).join(' | ')}`); continue }
    const [head, ...rest] = c[2].split(/\s+[—–-]\s+/)
    const what = rest.join(' — ')
    const content = c.slice(3).join(' | ').trim()
    const area = findArea(head.trim())
    sessions.push({
      date, start_time: range.start, minutes: range.minutes,
      subject: area?.name ?? head.trim(),
      topic: what && content ? `${what}: ${content}` : content || what || c[2],
    })
  }

  const order: string[] = []
  for (const s of sessions) if (!order.includes(s.subject)) order.push(s.subject)
  const subjects: ParsedSubject[] = order.map((name) => ({
    name,
    sessions: sessions.filter((s) => s.subject === name).length,
    weeklyGoalMin: areas.find((a) => a.name === name)?.weeklyMin ?? 0,
  }))

  const examName = title ? title.replace(/^cronograma(\s+de\s+estudos)?\s*[—–-]?\s*/i, '').trim() || null : null
  sessions.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
  return { title, examName, examDate, weeklyGoalMin, subjects, sessions, warnings }
}
