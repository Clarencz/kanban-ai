import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { boardsRouter, columnsRouter, tasksRouter } from "./routers/boards";
import { agentsRouter } from "./routers/agents";
import { providersRouter } from "./routers/providers";
import { executionRouter } from "./routers/execution";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  boards: boardsRouter,
  columns: columnsRouter,
  tasks: tasksRouter,
  agents: agentsRouter,
  providers: providersRouter,
  execution: executionRouter,
});

export type AppRouter = typeof appRouter;
