import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  Bot,
  Loader2,
  Clock,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const PRIORITY_STYLES: Record<
  string,
  { border: string; label: string }
> = {
  critical: { border: "border-l-red-500", label: "Critical" },
  high: { border: "border-l-orange-500", label: "High" },
  medium: { border: "border-l-yellow-500", label: "Medium" },
  low: { border: "border-l-blue-500", label: "Low" },
};

function getPriorityStyle(priority: string) {
  return (
    PRIORITY_STYLES[priority] ?? {
      border: "border-l-gray-500",
      label: priority,
    }
  );
}

export default function TriagePage() {
  const [selectedAgents, setSelectedAgents] = useState<Record<number, number>>(
    {},
  );

  const { data: triageTasks, isLoading } =
    trpc.boards.getTriageTasks.useQuery();
  const { data: agents } = trpc.agents.list.useQuery();

  const utils = trpc.useUtils();

  const dismissMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task dismissed from triage");
      utils.boards.getTriageTasks.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to dismiss: ${error.message}`);
    },
  });

  const executeMutation = trpc.execution.executeAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent execution started");
      utils.boards.getTriageTasks.invalidate();
    },
    onError: (error) => {
      toast.error(`Execution failed: ${error.message}`);
    },
  });

  const handleDismiss = (taskId: number) => {
    dismissMutation.mutate({ taskId, status: "pending" });
  };

  const handleAssignAndRun = (taskId: number) => {
    const agentId = selectedAgents[taskId];
    if (!agentId) {
      toast.error("Please select an agent first");
      return;
    }
    executeMutation.mutate({ taskId, agentId });
  };

  const triageCount = triageTasks?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <h1 className="text-3xl font-bold">Triage</h1>
        </div>
        {triageCount > 0 && (
          <Badge
            variant="secondary"
            className="text-xs tabular-nums"
          >
            {triageCount}
          </Badge>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && triageCount === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-lg font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No items need triage.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Triage list */}
      {!isLoading && triageTasks && triageTasks.length > 0 && (
        <div className="space-y-1">
          {triageTasks.map((task) => {
            const priority = getPriorityStyle(task.priority ?? "medium");

            return (
              <div
                key={task.id}
                className={`
                  group flex items-center gap-4 px-4 py-3
                  bg-card border rounded-lg
                  border-l-[3px] ${priority.border}
                  hover:bg-accent/50 transition-colors
                `}
              >
                {/* Task info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">
                      {task.title}
                    </span>
                    {"boardName" in task && task.boardName && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {task.boardName as string}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-lg">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Age badge */}
                {task.createdAt && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(task.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                )}

                {/* Agent selector */}
                <div className="shrink-0 w-[160px]">
                  <Select
                    value={selectedAgents[task.id]?.toString() ?? ""}
                    onValueChange={(val) =>
                      setSelectedAgents((prev) => ({
                        ...prev,
                        [task.id]: parseInt(val, 10),
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agents?.map((agent) => (
                        <SelectItem
                          key={agent.id}
                          value={agent.id.toString()}
                        >
                          <div className="flex items-center gap-1.5">
                            <Bot className="h-3 w-3 text-muted-foreground" />
                            {agent.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => handleAssignAndRun(task.id)}
                    disabled={
                      !selectedAgents[task.id] || executeMutation.isPending
                    }
                  >
                    {executeMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                    Assign & Run
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDismiss(task.id)}
                    disabled={dismissMutation.isPending}
                  >
                    {dismissMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
