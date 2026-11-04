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

## O painel (uma tela só)

| Seção | O que faz |
|---|---|
| **Hoje** | Tarefas urgentes ou vencendo, blocos do dia com “Iniciar” e “Feito”. O bloco em andamento fica marcado em amarelo. |
| **Foco** | Cronômetro (25/50/90 min) ligado a uma matéria. Ao encerrar, registra o tempo. Sobrevive a recarregar a página e mostra o tempo na aba. |
| **Semana** | Grade segunda a domingo com blocos fixos (repetem toda semana), visto nos concluídos e navegação entre semanas. |
| **Matérias** | Total de aulas, assistidas (+/−), % concluído e status de revisão espaçada (em dia, revisar em breve, atrasada). |
| **Materiais** | Estante de PDFs, livros, cursos, vídeos e links, filtrável por tipo. |
| **Metas** | Frase da semana (sugerida ou sua), horas brutas da semana vs. meta, meta por matéria, sequência de dias. |

Primeiro acesso: o botão **Criar plano inicial** cadastra Inglês e Azure com metas semanais e blocos de segunda a domingo. Tudo é editável.

## Design

“Mesa de estudo”: Tinta (escuro) e Papel (claro), cor por matéria, amarelo marca-texto reservado a um único significado, **agora**. Tipografia: Bricolage Grotesque (títulos e números) + Figtree (texto). Tokens em `src/app/globals.css`.

## Estrutura

- `src/lib/study.ts`: progresso, revisão espaçada, sequência, bloco atual, frase da semana, contagem para 2027
- `src/lib/timer.ts`: cronômetro por instantes (não por contagem)
- `src/lib/dates.ts`: datas no fuso local, semana começando na segunda
- `src/hooks/useStudy.ts`: dados (Supabase) · `useTimer.ts`: cronômetro persistido
- `src/components/`: uma seção por arquivo (`Today`, `FocusTimer`, `Week`, `Subjects`, `Shelf`, `Insights`)

## Próximos passos

- Definir qual certificação Azure (AZ-900, AZ-104…) e a data da prova, com contagem regressiva própria
- Plano de estudo por fases (trimestres de 2027) ligado às matérias
- Notificação do navegador quando o cronômetro terminar
