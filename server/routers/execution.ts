import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getTask, getAgent, getProvider, createTaskExecution, getTaskExecutions, createTaskChat, getTaskChats, updateTask } from "../db";
import { TRPCError } from "@trpc/server";
import { callLLM } from "./llm";

/**
 * Enhanced execution router with full context aggregation including chat history
 */
export const executionRouter = router({
  executeAgent: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      agentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await getTask(input.taskId, ctx.user.id);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const agent = await getAgent(input.agentId, ctx.user.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      const provider = await getProvider(agent.providerId, ctx.user.id);
      if (!provider) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
      }

      // Get prior executions for context
      const priorExecutions = await getTaskExecutions(input.taskId);
      const priorOutputs = priorExecutions
        .map((e) => `Agent Output:\n${e.output}`)
        .join("\n---\n");

      // Get full chat history
      const chats = await getTaskChats(input.taskId);
      const chatHistory = chats
        .map((c) => `${c.role === "user" ? "User" : "Agent"}: ${c.content}`)
        .join("\n");

      // Build comprehensive context message
      const contextParts = [
        `Task: ${task.title}`,
        `Description: ${task.description || "N/A"}`,
        `Priority: ${task.priority}`,
        `Status: ${task.status}`,
      ];

      if (agent.role) {
        contextParts.push(`Agent Role: ${agent.role}`);
      }

      if (priorOutputs) {
        contextParts.push(`\nPrior Agent Outputs:\n${priorOutputs}`);
      }

      if (chatHistory) {
        contextParts.push(`\nConversation History:\n${chatHistory}`);
      }

      const contextMessage = contextParts.join("\n");

      // Call LLM with full context
      let response: string;
      try {
        response = await callLLM(
          provider.type as any,
          provider.apiKey,
          agent.modelName,
          [
            {
              role: "user",
              content: contextMessage,
            },
          ],
          agent.systemPrompt || undefined
        );
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `LLM execution failed: ${error.message}`,
        });
      }

      // Create execution record
      await createTaskExecution({
        taskId: input.taskId,
        agentId: input.agentId,
        executionOrder: priorExecutions.length,
        inputContext: contextMessage,
        output: response,
        status: "completed",
      });

      // Add to chat history
      await createTaskChat({
        taskId: input.taskId,
        agentId: input.agentId,
        role: "assistant",
        content: response,
      });

      // Update task status based on agent role
      let newStatus = task.status;
      if (agent.role === "Reviewer") {
        newStatus = "in_progress";
      } else if (agent.role === "Coder") {
        newStatus = "in_progress";
      }

      await updateTask(input.taskId, ctx.user.id, {
        status: newStatus,
      });

      return { success: true, response };
    }),

  getTaskChats: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await getTask(input.taskId, ctx.user.id);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      return getTaskChats(input.taskId);
    }),

  addMessage: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await getTask(input.taskId, ctx.user.id);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      return createTaskChat({
        taskId: input.taskId,
        role: "user",
        content: input.content,
      });
    }),

  getExecutions: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await getTask(input.taskId, ctx.user.id);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      return getTaskExecutions(input.taskId);
    }),

  testAgent: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      testPrompt: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const agent = await getAgent(input.agentId, ctx.user.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      const provider = await getProvider(agent.providerId, ctx.user.id);
      if (!provider) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
      }

      try {
        const response = await callLLM(
          provider.type as any,
          provider.apiKey,
          agent.modelName,
          [
            {
              role: "user",
              content: input.testPrompt,
            },
          ],
          agent.systemPrompt || undefined
        );
        return { success: true, response };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Agent test failed: ${error.message}`,
        });
      }
    }),
});
