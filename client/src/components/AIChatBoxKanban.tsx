import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface AIChatBoxProps {
  taskId: number;
}

export default function AIChatBox({ taskId }: AIChatBoxProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: agents } = trpc.agents.list.useQuery();
  const { data: chats, refetch: refetchChats } = trpc.execution.getTaskChats.useQuery({ taskId });
  const { data: task } = trpc.tasks.get.useQuery({ taskId });

  const executeMutation = trpc.execution.executeAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent execution completed");
      setMessage("");
      refetchChats();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const addMessageMutation = trpc.execution.addMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchChats();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleExecuteAgent = async () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent");
      return;
    }

    setIsStreaming(true);
    try {
      await executeMutation.mutateAsync({
        taskId,
        agentId: parseInt(selectedAgentId),
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await addMessageMutation.mutateAsync({
      taskId,
      content: message,
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Agent</label>
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an agent to execute" />
          </SelectTrigger>
          <SelectContent>
            {agents?.map((agent) => (
              <SelectItem key={agent.id} value={agent.id.toString()}>
                {agent.name} ({agent.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 border border-border rounded-lg p-4 overflow-hidden flex flex-col bg-muted/30">
        <ScrollArea className="flex-1 mb-4">
          <div className="space-y-4 pr-4">
            {task && (
              <div className="bg-background/50 border border-border rounded p-3 text-sm space-y-2">
                <p className="font-medium">Task Context:</p>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong>Title:</strong> {task.title}</p>
                  {task.description && <p><strong>Description:</strong> {task.description}</p>}
                  <p><strong>Priority:</strong> {task.priority}</p>
                  {task.assignedAgentId && agents && (
                    <p><strong>Assigned Agent:</strong> {agents.find(a => a.id === task.assignedAgentId)?.name || "Unknown"}</p>
                  )}
                </div>
              </div>
            )}

            {chats && chats.length > 0 ? (
              chats.map((chat: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    chat.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {chat.role === "assistant" && (
                    <Bot className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      chat.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border"
                    }`}
                  >
                    <Streamdown className="text-sm">
                      {chat.content}
                    </Streamdown>
                  </div>
                  {chat.role === "user" && (
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Select an agent and execute to start.
              </div>
            )}

            {isStreaming && (
              <div className="flex gap-3 justify-start">
                <Loader2 className="w-4 h-4 text-primary flex-shrink-0 mt-1 animate-spin" />
                <div className="bg-background border border-border rounded-lg px-3 py-2">
                  <p className="text-sm text-muted-foreground">Agent is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Add context or instructions..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (selectedAgentId && !isStreaming) {
                  handleExecuteAgent();
                } else {
                  handleSendMessage();
                }
              }
            }}
            disabled={isStreaming}
          />
          <Button
            onClick={selectedAgentId ? handleExecuteAgent : handleSendMessage}
            disabled={isStreaming || !selectedAgentId || executeMutation.isPending || addMessageMutation.isPending}
            size="icon"
          >
            {isStreaming || executeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
