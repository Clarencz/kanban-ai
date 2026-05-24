import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** External identity identifier. Unique per user. With mock auth this is a fixed dev string. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const boards = mysqlTable("boards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isArchived: int("isArchived").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Board = typeof boards.$inferSelect;
export type InsertBoard = typeof boards.$inferInsert;

export const columns = mysqlTable("columns", {
  id: int("id").autoincrement().primaryKey(),
  boardId: int("boardId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  position: int("position").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Column = typeof columns.$inferSelect;
export type InsertColumn = typeof columns.$inferInsert;

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  columnId: int("columnId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  assignedAgentId: int("assignedAgentId"),
  status: mysqlEnum("status", ["triage", "pending", "in_progress", "completed", "blocked"]).default("pending").notNull(),
  position: int("position").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export const providers = mysqlTable("providers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    // Provider APIs (own models)
    "ai21",
    "aion",
    "alibaba",
    "cohere",
    "deepseek",
    "gemini",
    "mistral",
    "xai",
    "zai",
    // Inference providers
    "cerebras",
    "cloudflare",
    "github_models",
    "groq",
    "huggingface",
    "kilocode",
    "llm7io",
    "modelscope",
    "nebius",
    "nscale",
    "nvidia_nim",
    "ollama_cloud",
    "openrouter",
    "ovhcloud",
    "siliconflow",
  ]).notNull(),
  apiKey: varchar("apiKey", { length: 1024 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  providerId: int("providerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  modelName: varchar("modelName", { length: 255 }).notNull(),
  systemPrompt: text("systemPrompt"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

export const taskAgentExecutions = mysqlTable("taskAgentExecutions", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  agentId: int("agentId").notNull(),
  executionOrder: int("executionOrder").notNull(),
  inputContext: text("inputContext"),
  output: text("output"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "retrying"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  executedAt: timestamp("executedAt"),
  completedAt: timestamp("completedAt"),
});

export type TaskAgentExecution = typeof taskAgentExecutions.$inferSelect;
export type InsertTaskAgentExecution = typeof taskAgentExecutions.$inferInsert;

export const taskChats = mysqlTable("taskChats", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  agentId: int("agentId"),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskChat = typeof taskChats.$inferSelect;
export type InsertTaskChat = typeof taskChats.$inferInsert;