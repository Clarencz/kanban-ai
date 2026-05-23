# Kanban AI Agents - Application Delivery

## Overview

**Kanban AI Agents** is an elegant, dark-themed web application that enables collaborative AI-powered project management. Multiple LLM agents from 10+ free providers work together on tasks organized in a Kanban board, with full context preservation across agent executions.

## Core Features Implemented

### 1. Kanban Board with Drag-and-Drop
- **Responsive board layout** with customizable columns (Backlog, In Progress, Review, Done)
- **Full drag-and-drop support** for task cards between columns
- **Column management**: Create, rename, and delete columns
- **Task cards** displaying title, description, priority, and assigned agent
- **Real-time updates** to board state and task positions

### 2. Multi-Provider LLM Integration
Supports 10 free LLM providers:
- **Groq** - Fast inference with Llama 3.3, Mixtral
- **Mistral AI** - Small, medium, and large models
- **Google Gemini** - Gemini 2.5 Flash models
- **Cohere** - Command R and R+ models
- **GitHub Models** - GPT-4, Llama 3.3, Mistral
- **Cerebras** - Llama 3.1 and GPT-OSS models
- **OpenRouter** - Access to multiple models
- **HuggingFace** - Llama 2, Mistral, Nous Hermes
- **NVIDIA NIM** - Llama 3.1, Nemotron models
- **LLM7.io** - DeepSeek, GPT-4o models

### 3. AI Agent System
- **Agent Management**: Create agents with custom roles (Planner, Coder, Reviewer, etc.)
- **System Prompts**: Define agent behavior with custom instructions
- **Model Selection**: Choose specific models for each agent
- **Agent Testing**: Test agents with custom prompts before deployment
- **Provider Configuration**: Securely store and manage API keys per provider

### 4. In-Card AI Chat Panel
- **Message History**: View full conversation history with agents
- **Markdown Rendering**: Streamed LLM responses rendered with proper formatting
- **Task Context Display**: Shows task title, description, priority, and assigned agent
- **Prior Outputs**: Displays outputs from previous agent executions
- **Agent Selection**: Choose which agent to execute on the task
- **Real-time Feedback**: Loading states and error handling

### 5. Context Preservation & Agent Chaining
- **Full Context Aggregation**: Task description + priority + prior outputs + chat history
- **Sequential Execution**: Agents receive full context from previous executions
- **System Prompt Injection**: Custom system prompts guide agent behavior
- **Task Status Updates**: Automatic status transitions based on agent execution
- **Execution History**: Track all agent executions and their outputs

### 6. Dark-Themed Dashboard
- **Elegant Design**: Refined dark theme with careful typography and spacing
- **Sidebar Navigation**: Quick access to boards, agents, and providers
- **Responsive Layout**: Works seamlessly on desktop and tablet
- **Smooth Interactions**: Polished UI with thoughtful micro-interactions
- **User Authentication**: Manus OAuth integration with per-user data isolation

## Database Schema

### Core Tables
- **boards** - User projects/workspaces
- **columns** - Kanban board columns
- **tasks** - Individual work items with priority and status
- **agents** - AI agents with roles and system prompts
- **providers** - LLM provider configurations with API keys
- **taskAgentExecutions** - Execution history and outputs
- **taskChats** - Conversation history between users and agents

## API Architecture

### tRPC Routers
- **boards** - CRUD operations for boards and columns
- **tasks** - Task management and status updates
- **agents** - Agent creation, configuration, and management
- **providers** - Provider setup and API key management
- **execution** - Agent execution, chat history, and testing

### Key Procedures
- `boards.create/list/get/update/delete`
- `columns.create/update/delete`
- `tasks.create/list/get/update/delete`
- `agents.create/list/get/update/delete`
- `providers.create/list/get/update/delete/validateKey/getAvailableModels`
- `execution.executeAgent` - Run agent on task with full context
- `execution.testAgent` - Test agent configuration
- `execution.getTaskChats` - Retrieve conversation history
- `execution.addMessage` - Add user message to chat

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** components for consistent UI
- **tRPC** for type-safe API calls
- **Streamdown** for markdown rendering
- **Sonner** for toast notifications

### Backend
- **Express 4** server
- **tRPC 11** for RPC procedures
- **Drizzle ORM** for database access
- **MySQL/TiDB** for data persistence
- **Axios** for LLM API calls

### Infrastructure
- **Manus OAuth** for authentication
- **Manus Forge API** for LLM integration
- **S3 Storage** for file management

## Setup Instructions

### 1. Add LLM Providers
Navigate to **Providers** page and add your API keys:
- Click "Add Provider"
- Select provider type
- Enter your API key
- Click "Validate" to test connectivity

### 2. Create Agents
Navigate to **Agents** page:
- Click "Create Agent"
- Enter agent name
- Select provider and model
- Define agent role (e.g., "Coder", "Reviewer")
- Add system prompt (optional)
- Click "Create"

### 3. Create Boards
Navigate to **Home** page:
- Click "Create Board"
- Enter board name
- Click "Create"

### 4. Add Tasks
On your board:
- Click "Add Column" to create workflow stages
- Click "Add Task" in any column
- Fill in task details (title, description, priority)
- Assign an agent (optional)
- Click "Create"

### 5. Execute Agents
Click on any task card:
- Select an agent from the dropdown
- Click "Run Test" or "Execute"
- View the agent's response in the chat panel
- Continue the conversation or execute another agent

## Key Implementation Details

### Context Aggregation
Each agent execution includes:
```
Task: [title]
Description: [description]
Priority: [priority]
Status: [current status]
Agent Role: [role]

Prior Agent Outputs:
[previous execution outputs]

Conversation History:
[full chat history]
```

### Error Handling
- Invalid API keys are caught and reported
- Network errors trigger user-friendly error messages
- Failed LLM calls include detailed error information
- Graceful fallbacks for missing data

### Performance Considerations
- Optimized database queries with proper indexing
- Efficient chat history retrieval
- Lazy loading of agent/provider data
- Minimal re-renders with React hooks

## Limitations & Future Enhancements

### Current Limitations
- API keys stored in database (not encrypted)
- No streaming response support yet
- Single-agent execution per task (no auto-chaining)
- No column reorder functionality
- Limited to 10 pre-configured providers

### Recommended Enhancements
1. **Streaming Responses** - Real-time token-by-token rendering
2. **Auto-Chaining** - Automatic sequential agent execution by stage
3. **API Key Encryption** - Secure storage with encryption at rest
4. **Advanced Filtering** - Search and filter tasks by various criteria
5. **Execution Visualization** - Timeline view of agent executions
6. **Rate Limiting** - Token counting and provider rate limit awareness
7. **Fallback Logic** - Automatic provider fallback on failure
8. **Batch Operations** - Execute agents on multiple tasks
9. **Webhooks** - Trigger agents on external events
10. **Analytics** - Track agent performance and execution metrics

## Testing

### Manual Testing Checklist
- [ ] Create board and columns
- [ ] Add tasks with different priorities
- [ ] Assign agents to tasks
- [ ] Execute agents and verify responses
- [ ] Test with multiple providers
- [ ] Verify chat history persistence
- [ ] Test column rename/delete
- [ ] Verify task drag-and-drop
- [ ] Test agent testing interface
- [ ] Verify error handling

### Automated Tests
Run tests with:
```bash
pnpm test
```

## Deployment

The application is ready for deployment to Manus hosting:
1. Click "Publish" button in the Management UI
2. Configure custom domain (optional)
3. Application will be live at your Manus URL

## Support & Documentation

For issues or questions:
- Check the ARCHITECTURE.md for technical details
- Review the README.md for setup instructions
- Consult the database schema in drizzle/schema.ts
- Review tRPC router implementations for API details

## Version History

- **v1.0.0** - Initial release with core Kanban, multi-provider LLM integration, and agent management

---

**Built with ❤️ using Manus**
