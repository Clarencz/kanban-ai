import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBoard,
  getUserBoards,
  getBoardWithColumns,
  updateBoard,
  deleteBoard,
  createColumn,
  getBoardColumns,
  updateColumn,
  reorderColumns,
  deleteColumn,
  createTask,
  getColumnTasks,
  getTask,
  updateTask,
  deleteTask,
  getTriageTasks,
} from "../db";

const PRIORITY = ["low", "medium", "high", "critical"] as const;
const STATUS = ["triage", "pending", "in_progress", "completed", "blocked"] as const;

export const boardsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getUserBoards(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Board name is required"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [result] = await createBoard(ctx.user.id, {
        name: input.name,
        description: input.description || null,
      });
      return result;
    }),

  getWithColumns: protectedProcedure
    .input(z.object({ boardId: z.number() }))
    .query(async ({ ctx, input }) => {
      const board = await getBoardWithColumns(input.boardId, ctx.user.id);
      if (!board) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
      }
      return board;
    }),

  update: protectedProcedure
    .input(
      z.object({
        boardId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      updateBoard(input.boardId, ctx.user.id, {
        name: input.name,
        description: input.description,
      }),
    ),

  delete: protectedProcedure
    .input(z.object({ boardId: z.number() }))
    .mutation(({ ctx, input }) => deleteBoard(input.boardId, ctx.user.id)),

  getTriageTasks: protectedProcedure
    .query(({ ctx }) => getTriageTasks(ctx.user.id)),
});

async function assertBoardOwnership(boardId: number, userId: number) {
  const board = await getBoardWithColumns(boardId, userId);
  if (!board) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
  }
  return board;
}

export const columnsRouter = router({
  listByBoard: protectedProcedure
    .input(z.object({ boardId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertBoardOwnership(input.boardId, ctx.user.id);
      return getBoardColumns(input.boardId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        boardId: z.number(),
        name: z.string().min(1, "Column name is required"),
        position: z.number().int().nonnegative().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBoardOwnership(input.boardId, ctx.user.id);
      const existing = await getBoardColumns(input.boardId);
      const position = input.position ?? existing.length;
      return createColumn({
        boardId: input.boardId,
        name: input.name,
        position,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        columnId: z.number(),
        name: z.string().optional(),
        position: z.number().int().nonnegative().optional(),
      }),
    )
    .mutation(({ input }) =>
      updateColumn(input.columnId, {
        name: input.name,
        position: input.position,
      }),
    ),

  reorder: protectedProcedure
    .input(
      z.object({
        boardId: z.number(),
        columnIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBoardOwnership(input.boardId, ctx.user.id);
      return reorderColumns(input.boardId, input.columnIds);
    }),

  delete: protectedProcedure
    .input(z.object({ columnId: z.number() }))
    .mutation(({ input }) => deleteColumn(input.columnId)),
});

export const tasksRouter = router({
  getByColumn: protectedProcedure
    .input(z.object({ columnId: z.number() }))
    .query(({ input }) => getColumnTasks(input.columnId)),

  get: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await getTask(input.taskId, ctx.user.id);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return task;
    }),

  create: protectedProcedure
    .input(
      z.object({
        columnId: z.number(),
        title: z.string().min(1, "Task title is required"),
        description: z.string().optional(),
        priority: z.enum(PRIORITY).optional(),
        assignedAgentId: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getColumnTasks(input.columnId);
      return createTask({
        columnId: input.columnId,
        userId: ctx.user.id,
        title: input.title,
        description: input.description || null,
        priority: input.priority ?? "medium",
        assignedAgentId: input.assignedAgentId ?? null,
        position: existing.length,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(PRIORITY).optional(),
        status: z.enum(STATUS).optional(),
        assignedAgentId: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { taskId, ...patch } = input;
      const existing = await getTask(taskId, ctx.user.id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return updateTask(taskId, ctx.user.id, patch);
    }),

  move: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        columnId: z.number(),
        position: z.number().int().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getTask(input.taskId, ctx.user.id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return updateTask(input.taskId, ctx.user.id, {
        columnId: input.columnId,
        position: input.position,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(({ ctx, input }) => deleteTask(input.taskId, ctx.user.id)),
});
