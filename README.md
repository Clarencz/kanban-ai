# Kanban AI

Multi-board kanban with per-task AI agent chat. Bring your own LLM provider key (Groq, Mistral, Gemini, Cohere, GitHub Models, Cerebras, OpenRouter, HuggingFace, NVIDIA NIM, LLM7.io), define agents with a role + system prompt, and run them against task context.

## Stack

- **Client:** React 19, Vite 7, Tailwind 4, shadcn/ui, wouter, TanStack Query
- **Server:** Express 4, tRPC 11 (superjson), Node 20+
- **DB:** MySQL/TiDB via Drizzle ORM
- **Auth:** mock auto-login (every request is the fixed dev user). No OAuth.

## Setup

```bash
pnpm install
cp .env.example .env   # then edit DATABASE_URL
pnpm db:push           # generate + apply Drizzle migrations
pnpm dev               # http://localhost:3000
```

`.env` must define:

```env
DATABASE_URL='mysql://USER:PASS@HOST:PORT/DB?ssl={"rejectUnauthorized":true}'
VITE_APP_TITLE='Kanban AI'
```

## Layout

```
client/
  src/
    pages/        Feature pages (Home, BoardPage, AgentsPage, ProvidersPage)
    components/   KanbanBoard, KanbanColumn, KanbanCard, TaskDetailPanel, ...
    _core/hooks/  useAuth (wraps trpc.auth.me)
    lib/trpc.ts   tRPC client
drizzle/
  schema.ts       users, boards, columns, tasks, providers, agents,
                  taskAgentExecutions, taskChats
server/
  routers.ts      Top-level tRPC router
  routers/        boards, agents, providers, execution, llm
  db.ts           Drizzle query helpers
  _core/          context (mock auth), trpc, systemRouter, env, vite bridge
shared/
  const.ts        Cross-cutting constants
  types.ts        Re-exports + UI extension types
```

## Auth

There is no real authentication. `server/_core/context.ts` upserts a fixed user (`openId: "mock-dev-user"`, `role: "admin"`) on first request and attaches it to every tRPC context. `trpc.auth.logout` is a no-op kept for client compatibility. Replace `context.ts` if you want to plug a real provider back in.

## Scripts

- `pnpm dev` — Vite + tsx watch on Express
- `pnpm build` — Vite build + esbuild server bundle
- `pnpm start` — run the built server
- `pnpm check` — `tsc --noEmit`
- `pnpm test` — Vitest
- `pnpm db:push` — `drizzle-kit generate && drizzle-kit migrate`

## Notes

- LLM provider keys are stored in plaintext in the `providers` table for now. Add encryption before any non-dev deployment (see `todo.md`).
- The seeded dev user is created automatically; no signup flow.
