# Kanban AI Agents - Project TODO

## Phase 1: Architecture & Data Models
- [x] Define database schema for boards, columns, tasks, agents, providers, and chat history
- [x] Design tRPC router structure for board, task, agent, and provider operations
- [x] Create TypeScript types for all domain models
- [ ] Set up secure API key storage and encryption

## Phase 2: Core Kanban Board UI
- [ ] Build dashboard layout with sidebar navigation
- [x] Implement Kanban board component with columns
- [x] Add drag-and-drop support for task cards (basic HTML5 drag-and-drop)
- [x] Create task card component with title, description, priority, agent assignment
- [x] Implement column creation
- [x] Add column rename, delete, and reorder UI
- [x] Add board creation and selection UI

## Phase 3: Task Cards & In-Card AI Chat Panel
- [x] Build task detail modal/panel
- [x] Implement in-card chat interface with message history
- [x] Add markdown rendering for streamed LLM responses
- [x] Create agent execution trigger UI
- [x] Display full task context (description, priority, assigned agent) in chat panel
- [x] Show prior agent outputs in chat history
- [ ] Implement real-time streaming response display
- [ ] Implement column reorder UI and persistence

## Phase 4: Provider & Agent Management System
- [x] Create provider configuration page
- [x] Build API key input and validation UI for each provider (Groq, Mistral, Gemini, Cohere, GitHub Models, Cerebras, OpenRouter, HuggingFace, NVIDIA NIM, LLM7.io)
- [x] Implement model selection dropdown for each provider
- [x] Create agent creation/editing form with role and system prompt
- [x] Add agent testing interface to validate API keys and models
- [x] Build agent list view with edit/delete capabilities
- [ ] Implement secure API key storage in database

## Phase 5: Multi-Provider LLM Integration
- [x] Create LLM service abstraction layer supporting all 10 providers
- [x] Implement API key validation for each provider
- [ ] Build streaming response handler for chat completions
- [ ] Add error handling and retry logic
- [x] Create tRPC procedure for executing agent on task
- [ ] Implement token counting and rate limit awareness
- [ ] Add fallback provider logic if one fails

## Phase 6: Agent Chaining & Context Preservation
- [ ] Implement agent chaining logic (sequential execution across stages)
- [ ] Build context aggregation system including full chat history
- [ ] Create system prompt injection with full context
- [ ] Implement stage-to-stage output passing
- [ ] Add task status auto-update based on agent completion
- [ ] Create chain execution history tracking
- [ ] Build chain visualization/status display

## Phase 7: Polish UI & Finalize Features
- [ ] Refine dark theme styling and color palette
- [ ] Add smooth animations and transitions
- [ ] Implement loading states and skeletons
- [ ] Add empty states for boards and task lists
- [ ] Create toast notifications for user feedback
- [ ] Optimize responsive design for mobile
- [ ] Add keyboard shortcuts for common actions
- [ ] Implement undo/redo for task movements
- [ ] Add task search and filtering
- [ ] Create user settings page (theme, notifications, etc.)
- [ ] Write comprehensive vitest tests for all features
- [ ] Performance optimization and code cleanup

## Phase 8: Deployment & Delivery
- [ ] Create final checkpoint
- [ ] Verify all features work end-to-end
- [ ] Test with multiple providers and agents
- [ ] Document API key setup instructions
- [ ] Prepare user-facing documentation
- [ ] Deliver to user with setup guide
