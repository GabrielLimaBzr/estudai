# EstudAI

Painel central de estudos: o que estudar hoje, na semana e no ano. Pensado para ficar aberto no desktop o dia todo. Prioridade de 2027: **Inglês** e **certificação Azure**.

**Stack (custo zero):** Next.js (App Router) + TypeScript + Tailwind · Supabase (Postgres, Auth, RLS) · deploy na Vercel (free). Mesmo padrão do `gastai`/`emprestai`: `@supabase/ssr`, `proxy.ts` de auth, grupo `(protected)`, RLS por `user_id`.

## Rodar

```bash
cp .env.example .env.local   # URL e anon key do Supabase
npm install
npm run dev
npm test
```

Banco: rode `supabase/migrations/0001_init.sql` no SQL Editor. As tabelas (`subjects`, `tasks`, `blocks`, `study_log`, `links`, `settings`) não conflitam com as das outras apps, então pode reutilizar o mesmo projeto Supabase.

## O painel

Menu lateral só com texto e cinco páginas. A Home mostra só o essencial; o detalhe fica nas outras.

| Página | O que mostra |
|---|---|
| **Hoje** | **Foco** (cronômetro ligado a uma matéria, com o próximo bloco já sugerido), **Hoje** (blocos do dia e pendências), **Semana** em miniatura e **Rumo a 2027** (progresso das matérias prioritárias). |
| **Semana** | Grade de segunda a domingo com blocos fixos (repetem toda semana), visto nos concluídos e navegação entre semanas. |
| **Matérias** | Total de aulas, assistidas (+/−), % concluído e status de revisão espaçada (em dia, revisar em breve, atrasada). |
| **Materiais** | PDFs, livros, cursos, vídeos e links, filtráveis por tipo. |
| **Metas** | Horas da semana contra a meta, meta por matéria, sequência de dias e a frase da semana. |

O cronômetro continua ao trocar de página e aparece no menu. Primeiro acesso: **Criar plano inicial** cadastra Inglês e Azure com metas semanais e blocos de segunda a domingo. Tudo é editável.

## Design

Tom institucional: superfícies planas com borda de um fio, sem sombras, cantos de 6 a 8px, um único acento (azul-marinho no claro, azul-aço no escuro) e cores de matéria foscas só em pontos e barras finas. Títulos e números em Source Serif 4; interface em Public Sans. Tema claro (padrão), escuro ou automático. Tokens em `src/app/globals.css`.

## Estrutura

- `src/lib/study.ts`: progresso, revisão espaçada, sequência, bloco atual, frase da semana, contagem para 2027
- `src/lib/timer.ts`: cronômetro por instantes (não por contagem)
- `src/lib/dates.ts`: datas no fuso local, semana começando na segunda
- `src/hooks/useStudy.ts`: dados (Supabase) · `useTimer.ts`: cronômetro persistido
- `src/contexts/app.tsx`: dados, relógio e cronômetro acima das páginas
- `src/components/home.tsx`: painéis da Home · `Week`, `Subjects`, `Shelf`, `Insights`: uma página cada

## Próximos passos

- Definir qual certificação Azure (AZ-900, AZ-104…) e a data da prova, com contagem regressiva própria
- Plano de estudo por fases (trimestres de 2027) ligado às matérias
- Notificação do navegador quando o cronômetro terminar
