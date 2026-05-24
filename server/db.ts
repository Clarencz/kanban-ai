import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, boards, columns, tasks, providers, agents, taskAgentExecutions, taskChats, type InsertBoard, type InsertColumn, type InsertTask, type InsertProvider, type InsertAgent, type InsertTaskAgentExecution, type InsertTaskChat } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Board queries
export async function createBoard(userId: number, data: Omit<InsertBoard, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(boards).values({ ...data, userId });
  return result;
}

export async function getUserBoards(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(boards).where(and(eq(boards.userId, userId), eq(boards.isArchived, 0))).orderBy(desc(boards.createdAt));
}

export async function getBoardWithColumns(boardId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const board = await db.select().from(boards).where(and(eq(boards.id, boardId), eq(boards.userId, userId))).limit(1);
  if (!board.length) return null;
  
  const cols = await db.select().from(columns).where(eq(columns.boardId, boardId)).orderBy(asc(columns.position));
  
  // Fetch tasks for each column
  const colsWithTasks = await Promise.all(
    cols.map(async (col) => {
      const colTasks = await db.select().from(tasks).where(eq(tasks.columnId, col.id)).orderBy(asc(tasks.position));
      
      const tasksWithExecutions = await Promise.all(
        colTasks.map(async (task) => {
          const executions = await db.select().from(taskAgentExecutions).where(eq(taskAgentExecutions.taskId, task.id)).orderBy(asc(taskAgentExecutions.executionOrder));
          return { ...task, executions };
        })
      );
      
      return { ...col, tasks: tasksWithExecutions };
    })
  );
  
  return { ...board[0], columns: colsWithTasks };
}

export async function updateBoard(boardId: number, userId: number, data: Partial<InsertBoard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(boards).set(data).where(and(eq(boards.id, boardId), eq(boards.userId, userId)));
}

export async function deleteBoard(boardId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(boards).set({ isArchived: 1 }).where(and(eq(boards.id, boardId), eq(boards.userId, userId)));
}

// Column queries
export async function createColumn(data: InsertColumn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(columns).values(data);
}

export async function getBoardColumns(boardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(columns).where(eq(columns.boardId, boardId)).orderBy(asc(columns.position));
}

export async function updateColumn(columnId: number, data: Partial<InsertColumn>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(columns).set(data).where(eq(columns.id, columnId));
}

export async function reorderColumns(boardId: number, columnIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    for (let i = 0; i < columnIds.length; i++) {
      await tx
        .update(columns)
        .set({ position: i })
        .where(and(eq(columns.id, columnIds[i]), eq(columns.boardId, boardId)));
    }
  });
}

export async function deleteColumn(columnId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(columns).where(eq(columns.id, columnId));
}

// Task queries
export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(tasks).values(data);
}

export async function getColumnTasks(columnId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(tasks).where(eq(tasks.columnId, columnId)).orderBy(asc(tasks.position));
}

export async function getTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateTask(taskId: number, userId: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(tasks).set(data).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

export async function deleteTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

// Provider queries
export async function createProvider(data: InsertProvider) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(providers).values(data);
}

export async function getUserProviders(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(providers).where(eq(providers.userId, userId)).orderBy(desc(providers.createdAt));
}

export async function getProvider(providerId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(providers).where(and(eq(providers.id, providerId), eq(providers.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProvider(providerId: number, userId: number, data: Partial<InsertProvider>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(providers).set(data).where(and(eq(providers.id, providerId), eq(providers.userId, userId)));
}

export async function deleteProvider(providerId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(providers).where(and(eq(providers.id, providerId), eq(providers.userId, userId)));
}

// Agent queries
export async function createAgent(data: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(agents).values(data);
}

export async function getUserAgents(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.createdAt));
}

export async function getAgent(agentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(agents).where(and(eq(agents.id, agentId), eq(agents.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAgent(agentId: number, userId: number, data: Partial<InsertAgent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(agents).set(data).where(and(eq(agents.id, agentId), eq(agents.userId, userId)));
}

export async function deleteAgent(agentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(agents).where(and(eq(agents.id, agentId), eq(agents.userId, userId)));
}

// Task Agent Execution queries
export async function createTaskExecution(data: InsertTaskAgentExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(taskAgentExecutions).values(data);
}

export async function getTaskExecutions(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(taskAgentExecutions).where(eq(taskAgentExecutions.taskId, taskId)).orderBy(asc(taskAgentExecutions.executionOrder));
}

export async function updateTaskExecution(executionId: number, data: Partial<InsertTaskAgentExecution>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(taskAgentExecutions).set(data).where(eq(taskAgentExecutions.id, executionId));
}

// Task Chat queries
export async function createTaskChat(data: InsertTaskChat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(taskChats).values(data);
}

export async function getTaskChats(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(taskChats).where(eq(taskChats.taskId, taskId)).orderBy(asc(taskChats.createdAt));
}

// Triage queries
export async function getTriageTasks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select({
    id: tasks.id,
    columnId: tasks.columnId,
    userId: tasks.userId,
    title: tasks.title,
    description: tasks.description,
    priority: tasks.priority,
    assignedAgentId: tasks.assignedAgentId,
    status: tasks.status,
    position: tasks.position,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
    boardName: boards.name,
    boardId: boards.id,
  }).from(tasks)
    .innerJoin(columns, eq(tasks.columnId, columns.id))
    .innerJoin(boards, eq(columns.boardId, boards.id))
    .where(and(eq(tasks.userId, userId), eq(tasks.status, 'triage')))
    .orderBy(desc(tasks.priority), asc(tasks.createdAt));
}

// All executions with task and agent info
export async function getAllExecutions(userId: number, limit: number = 50, offset: number = 0, statusFilter?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(tasks.userId, userId)];
  if (statusFilter) {
    conditions.push(eq(taskAgentExecutions.status, statusFilter as any));
  }
  
  return db.select({
    id: taskAgentExecutions.id,
    taskId: taskAgentExecutions.taskId,
    agentId: taskAgentExecutions.agentId,
    executionOrder: taskAgentExecutions.executionOrder,
    inputContext: taskAgentExecutions.inputContext,
    output: taskAgentExecutions.output,
    status: taskAgentExecutions.status,
    errorMessage: taskAgentExecutions.errorMessage,
    executedAt: taskAgentExecutions.executedAt,
    completedAt: taskAgentExecutions.completedAt,
    taskTitle: tasks.title,
    taskPriority: tasks.priority,
    agentName: agents.name,
    agentRole: agents.role,
    agentModel: agents.modelName,
  }).from(taskAgentExecutions)
    .innerJoin(tasks, eq(taskAgentExecutions.taskId, tasks.id))
    .innerJoin(agents, eq(taskAgentExecutions.agentId, agents.id))
    .where(and(...conditions))
    .orderBy(desc(taskAgentExecutions.executedAt))
    .limit(limit)
    .offset(offset);
}
