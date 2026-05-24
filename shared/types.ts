// Re-export database types for frontend use
export type {
  Board,
  InsertBoard,
  Column,
  InsertColumn,
  Task,
  InsertTask,
  Provider,
  InsertProvider,
  Agent,
  InsertAgent,
  TaskAgentExecution,
  InsertTaskAgentExecution,
  TaskChat,
  InsertTaskChat,
} from "../drizzle/schema";

// Import types for extended interfaces
import type {
  Board,
  Column,
  Task,
  Provider,
  Agent,
  TaskAgentExecution,
  TaskChat,
} from "../drizzle/schema";

// Extended types for UI
export interface ColumnWithTasks extends Column {
  tasks?: TaskWithExecutions[];
}

export interface BoardWithColumns extends Board {
  columns?: ColumnWithTasks[];
}

export interface TaskWithExecutions extends Task {
  executions?: TaskAgentExecution[];
  chats?: TaskChat[];
}

export interface AgentWithProvider extends Agent {
  provider?: Provider;
}
