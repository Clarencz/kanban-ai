import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AIChatBox from "./AIChatBoxKanban";
import ExecutionPipeline from "./ExecutionPipeline";
import DependencyGraph from "./DependencyGraph";

interface TaskDetailPanelProps {
  taskId: number;
  onClose: () => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
const STATUS_OPTIONS = [
  "triage",
  "pending",
  "in_progress",
  "completed",
  "blocked",
] as const;

export default function TaskDetailPanel({
  taskId,
  onClose,
}: TaskDetailPanelProps) {
  const { data: task, isLoading } = trpc.tasks.get.useQuery({ taskId });
  const { data: executions, isLoading: isLoadingExecs } =
    trpc.execution.getExecutions.useQuery({ taskId });
  const { data: agents } = trpc.agents.list.useQuery();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editStatus, setEditStatus] = useState("pending");
  const utils = trpc.useUtils();

  // Sync form state when task loads
  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setEditPriority(task.priority);
      setEditStatus(task.status);
    }
  }, [task]);

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      setIsEditing(false);
      utils.tasks.get.invalidate({ taskId });
      utils.boards.getWithColumns.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const executeMutation = trpc.execution.executeAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent execution started");
      utils.execution.getExecutions.invalidate({ taskId });
      utils.boards.getWithColumns.invalidate();
    },
    onError: (err) => {
      toast.error(`Execution failed: ${err.message}`);
    },
  });

  const handleSaveChanges = async () => {
    await updateTaskMutation.mutateAsync({
      taskId,
      title: editTitle,
      description: editDescription,
      priority: editPriority as any,
      status: editStatus as any,
    });
  };

  const handleRerun = async (agentId: number) => {
    await executeMutation.mutateAsync({ taskId, agentId });
  };

  // Build agent name map for pipeline
  const agentNameMap: Record<number, { name: string; model: string }> = {};
  if (agents && executions) {
    for (const exec of executions) {
      const agent = agents.find((a) => a.id === exec.agentId);
      if (agent) {
        agentNameMap[agent.id] = {
          name: agent.name,
          model: agent.modelName,
        };
      }
    }
  }

  // Agent name map for DAG
  const dagAgentNames: Record<number, string> = {};
  if (agents) {
    for (const a of agents) {
      dagAgentNames[a.id] = a.name;
    }
  }

  if (isLoading) {
    return (
      <Drawer open={true} onOpenChange={onClose}>
        <DrawerContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <Drawer open={true} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>Task Details</DrawerTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-6 pb-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="ai">AI Chat</TabsTrigger>
              <TabsTrigger value="history" className="relative">
                Pipeline
                {executions && executions.length > 0 && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    {executions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="dag" className="gap-1.5">
                <GitBranch className="w-3 h-3" />
                DAG
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="mt-1 min-h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={editPriority}
                        onValueChange={(val) => setEditPriority(val as any)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={editStatus}
                        onValueChange={(val) => setEditStatus(val as any)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s
                                .replace(/_/g, " ")
                                .replace(/^\w/, (c) => c.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={updateTaskMutation.isPending}
                    >
                      {updateTaskMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{task.title}</h2>
                  </div>

                  {task.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{task.priority}</Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        task.status === "triage" &&
                          "border-[var(--status-triage)] text-[var(--status-triage)]",
                        task.status === "completed" &&
                          "border-[var(--status-completed)] text-[var(--status-completed)]",
                        task.status === "in_progress" &&
                          "border-[var(--status-running)] text-[var(--status-running)]"
                      )}
                    >
                      {task.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Created: {new Date(task.createdAt).toLocaleString()}
                    </p>
                    <p>
                      Updated: {new Date(task.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full"
                  >
                    Edit Task
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="mt-6 h-96">
              <AIChatBox taskId={taskId} />
            </TabsContent>

            <TabsContent value="history" className="mt-6 pb-6">
              {isLoadingExecs ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ExecutionPipeline
                  executions={executions || []}
                  compact={false}
                  onRerun={handleRerun}
                  isRerunning={executeMutation.isPending}
                  agentNames={agentNameMap}
                />
              )}
            </TabsContent>

            <TabsContent value="dag" className="mt-6 pb-6">
              {isLoadingExecs ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <DependencyGraph
                  taskTitle={task.title}
                  executions={executions || []}
                  agentNames={dagAgentNames}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
