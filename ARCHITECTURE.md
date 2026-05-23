# Kanban AI Agents - Architecture & Data Models

## System Overview

The Kanban AI Agents application is a full-stack web application that enables users to manage project workflows through a Kanban board interface while leveraging multiple free LLM providers as collaborative agents. The system supports agent chaining, context preservation, and real-time streaming responses.

## Database Schema

### Core Tables

**users** (existing)
- id: int (primary key)
- openId: varchar (Manus OAuth identifier)
- name: text
- email: varchar
- role: enum (user | admin)
- createdAt: timestamp
- updatedAt: timestamp
- lastSignedIn: timestamp

**boards**
- id: int (primary key)
- userId: int (foreign key to users)
- name: varchar (board title)
- description: text
- createdAt: timestamp
- updatedAt: timestamp
- isArchived: boolean (default: false)

**columns**
- id: int (primary key)
- boardId: int (foreign key to boards)
- name: varchar (e.g., "Backlog", "In Progress", "Review", "Done")
- position: int (order in board)
- createdAt: timestamp
- updatedAt: timestamp

**tasks**
- id: int (primary key)
- columnId: int (foreign key to columns)
- userId: int (foreign key to users)
- title: varchar
- description: text
- priority: enum (low | medium | high | critical)
- assignedAgentId: int (foreign key to agents, nullable)
- status: enum (pending | in_progress | completed | blocked)
- position: int (order in column)
- createdAt: timestamp
- updatedAt: timestamp

**providers**
- id: int (primary key)
- userId: int (foreign key to users)
- name: varchar (e.g., "Groq", "Mistral", "Gemini")
- type: enum (groq | mistral | gemini | cohere | github_models | cerebras | openrouter | huggingface | nvidia_nim | llm7io)
- apiKey: varchar (encrypted)
- isActive: boolean (default: true)
- createdAt: timestamp
- updatedAt: timestamp

**agents**
- id: int (primary key)
- userId: int (foreign key to users)
- providerId: int (foreign key to providers)
- name: varchar (e.g., "Code Reviewer", "Documentation Writer")
- role: varchar (e.g., "Planner", "Coder", "Reviewer")
- modelName: varchar (model identifier for provider)
- systemPrompt: text (custom system prompt)
- isActive: boolean (default: true)
- createdAt: timestamp
- updatedAt: timestamp

**taskAgentExecutions**
- id: int (primary key)
- taskId: int (foreign key to tasks)
- agentId: int (foreign key to agents)
- executionOrder: int (position in chain)
- inputContext: json (task description, prior outputs, chat history)
- output: longtext (agent response)
- status: enum (pending | running | completed | failed)
- errorMessage: text (if failed)
- executedAt: timestamp
- completedAt: timestamp

**taskChats**
- id: int (primary key)
- taskId: int (foreign key to tasks)
- agentId: int (foreign key to agents, nullable for user messages)
- role: enum (user | assistant | system)
- content: text (message content)
- createdAt: timestamp

## API Architecture (tRPC Routers)

### boards Router
- `list()` - Get all boards for authenticated user
- `create(input: { name, description })` - Create new board
- `update(id, input: { name, description })` - Update board
- `delete(id)` - Archive board
- `getWithColumns(id)` - Get board with all columns and tasks

### columns Router
- `create(input: { boardId, name })` - Create column in board
- `update(id, input: { name, position })` - Update column
- `delete(id)` - Delete column
- `reorder(input: { columnId, position })` - Reorder columns

### tasks Router
- `create(input: { columnId, title, description, priority })` - Create task
- `update(id, input: { title, description, priority, status })` - Update task
- `delete(id)` - Delete task
- `move(input: { taskId, columnId, position })` - Move task (drag-and-drop)
- `assignAgent(input: { taskId, agentId })` - Assign agent to task
- `getWithHistory(id)` - Get task with all executions and chat history

### agents Router
- `list()` - Get all agents for user
- `create(input: { providerId, name, role, modelName, systemPrompt })` - Create agent
- `update(id, input: { name, role, modelName, systemPrompt })` - Update agent
- `delete(id)` - Delete agent
- `test(input: { agentId, testPrompt })` - Test agent with sample prompt

### providers Router
- `list()` - Get all providers for user
- `create(input: { type, apiKey })` - Add provider (encrypts API key)
- `update(id, input: { apiKey })` - Update API key
- `delete(id)` - Remove provider
- `validateKey(input: { type, apiKey })` - Validate API key with provider
- `getAvailableModels(input: { type, apiKey })` - Fetch available models for provider

### taskAgentExecution Router
- `execute(input: { taskId, agentId })` - Trigger agent execution on task
- `executeChain(input: { taskId, agentIds })` - Execute multiple agents in sequence
- `getHistory(taskId)` - Get execution history for task
- `getContextForExecution(taskId)` - Get aggregated context for agent

### taskChat Router
- `getMessages(taskId)` - Get chat history for task
- `addMessage(input: { taskId, content })` - Add user message
- `streamAgentResponse(input: { taskId, agentId, message })` - Stream agent response

## LLM Provider Integration

### Supported Providers

| Provider | Base URL | Auth | Free Tier | Models |
|----------|----------|------|-----------|--------|
| Groq | api.groq.com | API Key | 30 RPM | llama-3.3-70b, llama-3.1-8b, etc. |
| Mistral AI | api.mistral.ai | API Key | ~1B tokens/month | Mistral Small, Medium, Large, Codestral |
| Google Gemini | generativelanguage.googleapis.com | API Key | 10 RPM, 250 RPD | Gemini 2.5 Flash, Flash-Lite |
| Cohere | api.cohere.com | API Key | 1,000 calls/month | Command R+, Command R, etc. |
| GitHub Models | models.inference.ai.azure.com | GitHub Token | 10 RPM | GPT-4, Llama, DeepSeek, etc. |
| Cerebras | api.cerebras.ai | API Key | 1M tokens/day | Llama 3.1, Qwen, GPT-OSS |
| OpenRouter | openrouter.ai | API Key | 35+ free models | DeepSeek, Mistral, Llama, etc. |
| HuggingFace | api-inference.huggingface.co | API Key | ~$0.10/month free | Llama 3.1, Mistral, Phi, etc. |
| NVIDIA NIM | integrate.api.nvidia.com | API Key | No daily cap | DeepSeek R1, Llama 3.1, Nemotron |
| LLM7.io | api.llm7.io | API Key (optional) | 30 RPM | DeepSeek, Gemini, GPT-4o, Mistral |

### LLM Service Architecture

```
LLMService (abstraction)
├── GroqProvider
├── MistralProvider
├── GeminiProvider
├── CohereProvider
├── GitHubModelsProvider
├── CerebrasProvider
├── OpenRouterProvider
├── HuggingFaceProvider
├── NVIDIANIMProvider
└── LLM7ioProvider

Each provider implements:
- validateApiKey(apiKey: string): Promise<boolean>
- getAvailableModels(apiKey: string): Promise<string[]>
- createChatCompletion(config: ChatConfig): Promise<ChatResponse>
- streamChatCompletion(config: ChatConfig): AsyncIterable<string>
```

## Agent Chaining & Context Flow

### Context Aggregation

When executing an agent, the system builds a comprehensive context object:

```typescript
interface AgentExecutionContext {
  taskDescription: string;
  taskPriority: string;
  priorExecutions: Array<{
    agentName: string;
    output: string;
    executedAt: Date;
  }>;
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentAgent: {
    name: string;
    role: string;
    systemPrompt: string;
  };
}
```

### System Prompt Injection

Each agent receives a system prompt that includes:
1. Base system prompt (user-defined)
2. Task context (title, description, priority)
3. Prior agent outputs (formatted as previous step results)
4. Chat history (recent messages for continuity)

### Sequential Execution

For agent chaining:
1. Execute Agent 1 on task → Store output in taskAgentExecutions
2. Load context including Agent 1's output
3. Execute Agent 2 with enriched context
4. Repeat for remaining agents in chain
5. Update task status based on final execution

## Frontend Architecture

### Page Structure

```
App.tsx
├── DashboardLayout
│   ├── Sidebar Navigation
│   │   ├── Boards List
│   │   ├── Agents
│   │   └── Providers
│   └── Main Content
│       ├── BoardPage
│       │   ├── KanbanBoard
│       │   │   ├── Column (draggable)
│       │   │   │   └── TaskCard (draggable)
│       │   │   └── TaskDetailPanel
│       │   │       ├── TaskInfo
│       │   │       ├── AgentAssignment
│       │   │       └── AIChatBox
│       ├── AgentsPage
│       │   ├── AgentList
│       │   └── AgentForm
│       └── ProvidersPage
│           ├── ProviderList
│           └── ProviderForm
```

### Key Components

- **KanbanBoard**: Main board display with columns and tasks
- **TaskCard**: Compact task representation with drag support
- **TaskDetailPanel**: Full task view with chat and execution
- **AIChatBox**: Chat interface with streaming markdown rendering
- **AgentConfigForm**: Form for creating/editing agents
- **ProviderConfigForm**: Form for adding/validating provider API keys

## Security Considerations

1. **API Key Encryption**: All provider API keys are encrypted before storage using a server-side secret
2. **User Isolation**: All queries are scoped to authenticated user
3. **Protected Procedures**: All mutations use `protectedProcedure` requiring authentication
4. **Rate Limiting**: Implement rate limiting per provider per user
5. **Error Handling**: Never expose API keys or sensitive details in error messages

## Performance Optimizations

1. **Streaming Responses**: Use streaming for long LLM responses to show results incrementally
2. **Optimistic Updates**: Update UI optimistically for drag-and-drop operations
3. **Query Caching**: Cache board and agent lists with invalidation on changes
4. **Lazy Loading**: Load task details and chat history on demand
5. **Database Indexing**: Index on userId, boardId, columnId for fast queries

## Data Flow Diagram

```
User Action (drag task)
    ↓
Frontend optimistic update
    ↓
tRPC mutation (tasks.move)
    ↓
Server validates & updates database
    ↓
Frontend invalidates cache
    ↓
UI reflects final state

User triggers agent execution
    ↓
Frontend calls tasks.executeAgent
    ↓
Server loads task context
    ↓
Server calls LLM provider
    ↓
Server streams response to client
    ↓
Client renders markdown in real-time
    ↓
Server saves execution to database
    ↓
Frontend updates task with agent output
```

## Error Handling Strategy

1. **Provider Errors**: Gracefully handle API failures with retry logic and fallback providers
2. **Network Errors**: Implement exponential backoff for transient failures
3. **Validation Errors**: Clear user feedback for invalid inputs (API keys, model names)
4. **Rate Limiting**: Queue requests and inform user of rate limit status
5. **Streaming Errors**: Gracefully handle mid-stream connection drops
