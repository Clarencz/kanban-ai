import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { boardsRouter, columnsRouter, tasksRouter } from "./routers/boards";
import { agentsRouter } from "./routers/agents";
import { providersRouter } from "./routers/providers";
import { executionRouter } from "./routers/execution";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    // Mock auth: logout is a no-op. Kept so the client useAuth hook stays valid.
    logout: publicProcedure.mutation(() => ({ success: true } as const)),
  }),

  boards: boardsRouter,
  columns: columnsRouter,
  tasks: tasksRouter,
  agents: agentsRouter,
  providers: providersRouter,
  execution: executionRouter,
});

export type AppRouter = typeof appRouter;
