import { TaskWithExecutions } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bot,
  CheckCircle,
  Circle,
  Loader2,
  XCircle,
  RefreshCw,
  PlayCircle,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";

interface KanbanCardProps {
  task: TaskWithExecutions;
  columnId: number;
  index: number;
  onTaskMove: (
    taskId: number,
    fromColumnId: number,
    toColumnId: number,
    newPosition: number
  ) => void;
  onTaskSelect: (taskId: number) => void;
}

const PRIORITY_COLORS = {
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-[var(--status-completed)]",
  failed: "bg-[var(--status-failed)]",
  running: "bg-[var(--status-running)] animate-pipeline-pulse",
  pending: "bg-[var(--status-queued)]",
  retrying: "bg-[var(--status-retrying)] animate-spin",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-3 h-3 text-[var(--status-completed)]" />,
  failed: <XCircle className="w-3 h-3 text-[var(--status-failed)]" />,
  running: (
    <Loader2 className="w-3 h-3 text-[var(--status-running)] animate-spin" />
  ),
  pending: <Circle className="w-3 h-3 text-[var(--status-queued)]" />,
  retrying: (
    <RefreshCw className="w-3 h-3 text-[var(--status-retrying)] animate-spin" />
  ),
};

function CompactPipeline({
  executions,
}: {
  executions: NonNullable<TaskWithExecutions["executions"]>;
}) {
  const recent = executions.slice(-6);
  if (recent.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {recent.map((exec, i) => {
          const statusColor =
            STATUS_COLORS[exec.status] || STATUS_COLORS.pending;
          const duration =
            exec.executedAt && exec.completedAt
              ? `${differenceInSeconds(new Date(exec.completedAt), new Date(exec.executedAt))}s`
              : exec.status === "running"
                ? "running…"
                : "–";

          return (
            <Tooltip key={exec.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  {i > 0 && (
                    <div
                      className={cn(
                        "w-2 h-[2px]",
                        exec.status === "completed" || exec.status === "running"
                          ? "bg-[var(--pipeline-line-active)]"
                          : "bg-[var(--pipeline-line)]"
                      )}
                    />
                  )}
                  <div
                    className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusColor)}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">
                  Run #{exec.executionOrder + 1} • {exec.status}
                </p>
                <p className="text-muted-foreground">{duration}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default function KanbanCard({
  task,
  columnId,
  index,
  onTaskMove,
  onTaskSelect,
}: KanbanCardProps) {
  const utils = trpc.useUtils();
  const { data: agent } = trpc.agents.get.useQuery(
    { agentId: task.assignedAgentId! },
    { enabled: !!task.assignedAgentId }
  );

  const { data: agents } = trpc.agents.list.useQuery();

  const executeMutation = trpc.execution.executeAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent finished — see pipeline");
      utils.boards.getWithColumns.invalidate();
      utils.execution.getExecutions.invalidate({ taskId: task.id });
    },
    onError: (err) => {
      console.error("[executeAgent] failed", err);
      toast.error(`Execution failed: ${err.message}`, { duration: 8000 });
    },
  });

  const handleClaimAndRun = async (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!agents || agents.length === 0) {
      toast.error(
        "No agents available. Configure a provider on /providers and create an agent on /agents first.",
        { duration: 6000 },
      );
      return;
    }

    const agentId = task.assignedAgentId || agents[0].id;
    const agentName =
      agents.find((a) => a.id === agentId)?.name || "agent";
    toast.loading(`Running ${agentName}…`, { id: `run-${task.id}` });
    try {
      await executeMutation.mutateAsync({ taskId: task.id, agentId });
      toast.dismiss(`run-${task.id}`);
    } catch {
      toast.dismiss(`run-${task.id}`);
      // onError already toasted the failure.
    }
  };

  // Prevent the Card's drag handler from swallowing button interactions.
  const stopDragInit = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.setData("fromColumnId", columnId.toString());
    e.dataTransfer.setData("fromIndex", index.toString());
  };

  const isTriage = task.status === "triage";
  const hasExecutions = task.executions && task.executions.length > 0;
  const isRunning = executeMutation.isPending;
  const hasAgents = agents && agents.length > 0;

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onClick={() => onTaskSelect(task.id)}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        "bg-card border-none shadow-sm hover:ring-1 hover:ring-primary/20",
        "group/card",
        isTriage && "animate-triage-glow border border-[var(--status-triage)]/30",
        isRunning && "ring-1 ring-[var(--status-running)]/40"
      )}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-[13px] leading-snug group-hover/card:text-primary transition-colors line-clamp-2">
            {task.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {isTriage && (
              <Badge
                variant="destructive"
                className="text-[9px] px-1.5 py-0 h-4 uppercase font-black bg-[var(--status-triage)] text-background"
              >
                Triage
              </Badge>
            )}
            {!isTriage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-6 w-6 shrink-0 transition-colors",
                      isRunning && "bg-[var(--status-running)]/10",
                      !hasAgents && "opacity-50",
                    )}
                    draggable={false}
                    onMouseDown={stopDragInit}
                    onPointerDown={stopDragInit}
                    onDragStart={(e) => e.preventDefault()}
                    onClick={handleClaimAndRun}
                    disabled={isRunning || !hasAgents}
                    aria-label="Start agent on this task"
                  >
                    {isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--status-running)]" />
                    ) : (
                      <PlayCircle className="w-3.5 h-3.5 text-primary" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  {hasAgents
                    ? `Run ${
                        task.assignedAgentId
                          ? agent?.name || "assigned agent"
                          : agents?.[0]?.name || "first agent"
                      }`
                    : "Configure an agent first"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {task.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {isTriage && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(task.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-[11px] gap-1.5 border-dashed border-[var(--status-triage)]/40 hover:border-[var(--status-triage)] hover:bg-[var(--status-triage)]/5"
              draggable={false}
              onMouseDown={stopDragInit}
              onPointerDown={stopDragInit}
              onDragStart={(e) => e.preventDefault()}
              onClick={handleClaimAndRun}
              disabled={executeMutation.isPending}
            >
              {executeMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <PlayCircle className="w-3 h-3 text-[var(--status-triage)]" />
              )}
              Claim & Run Agent
            </Button>
          </div>
        )}

        {/* CI-style compact pipeline */}
        {hasExecutions && (
          <div className="pt-0.5">
            <CompactPipeline executions={task.executions!} />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider",
                PRIORITY_COLORS[task.priority]
              )}
            >
              {task.priority}
            </Badge>
            {task.status && task.status !== "pending" && task.status !== "triage" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {task.status.replace("_", " ")}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {agent && (
              <div
                title={`Assigned to ${agent.name}`}
                className="flex items-center"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
