import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createAgent, getUserAgents, getAgent, updateAgent, deleteAgent, getProvider } from "../db";
import { TRPCError } from "@trpc/server";

export const agentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserAgents(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      providerId: z.number(),
      name: z.string().min(1, "Agent name is required"),
      role: z.string().min(1, "Role is required"),
      modelName: z.string().min(1, "Model name is required"),
      systemPrompt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const provider = await getProvider(input.providerId, ctx.user.id);
      if (!provider) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
      }

      return createAgent({
        userId: ctx.user.id,
        providerId: input.providerId,
        name: input.name,
        role: input.role,
        modelName: input.modelName,
        systemPrompt: input.systemPrompt,
      });
    }),

  get: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const agent = await getAgent(input.agentId, ctx.user.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }
      return agent;
    }),

  update: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      modelName: z.string().optional(),
      systemPrompt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const agent = await getAgent(input.agentId, ctx.user.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      return updateAgent(input.agentId, ctx.user.id, {
        name: input.name,
        role: input.role,
        modelName: input.modelName,
        systemPrompt: input.systemPrompt,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const agent = await getAgent(input.agentId, ctx.user.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      return deleteAgent(input.agentId, ctx.user.id);
    }),
});
