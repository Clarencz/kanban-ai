import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  History,
  CheckCircle,
  XCircle,
  Loader2,
  Circle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "running" | "completed" | "failed";

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Circle; color: string; dotColor: string; label: string }
> = {
  pending: {
    icon: Circle,
    color: "text-gray-400",
    dotColor: "bg-gray-400",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    color: "text-blue-400",
    dotColor: "bg-blue-400",
    label: "Running",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-400",
    dotColor: "bg-green-400",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-400",
    dotColor: "bg-red-400",
    label: "Failed",
  },
  retrying: {
    icon: RefreshCw,
    color: "text-amber-400",
    dotColor: "bg-amber-400",
    label: "Retrying",
  },
};

function getStatusInfo(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      icon: Circle,
      color: "text-gray-400",
      dotColor: "bg-gray-400",
      label: status,
    }
  );
}

function computeDurationLabel(
  executedAt: Date | string | null | undefined,
  completedAt: Date | string | null | undefined,
): string {
  if (!executedAt) return "—";
  const start = new Date(executedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const secs = differenceInSeconds(end, start);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins}m ${remSecs}s`;
}

export default function ExecutionHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const queryInput: { limit: number; offset: number; status?: string } = {
    limit,
    offset,
  };
  if (statusFilter !== "all") {
    queryInput.status = statusFilter;
  }

  const { data, isLoading } = trpc.execution.listAll.useQuery(queryInput);

  const executions = data ?? [];
  const hasMore = executions.length >= limit;

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold">Execution History</h1>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(val) => {
            if (val) {
              setStatusFilter(val as StatusFilter);
              setOffset(0);
              setExpandedIds(new Set());
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all" className="text-xs px-3">
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="running" className="text-xs px-3">
            <div className="h-2 w-2 rounded-full bg-blue-400 mr-1.5" />
            Running
          </ToggleGroupItem>
          <ToggleGroupItem value="completed" className="text-xs px-3">
            <div className="h-2 w-2 rounded-full bg-green-400 mr-1.5" />
            Completed
          </ToggleGroupItem>
          <ToggleGroupItem value="failed" className="text-xs px-3">
            <div className="h-2 w-2 rounded-full bg-red-400 mr-1.5" />
            Failed
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && executions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Terminal className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No executions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run an agent on a task to see history.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Execution list */}
      {!isLoading && executions.length > 0 && (
        <div className="space-y-px rounded-lg border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[32px_1fr_1fr_140px_80px_100px] gap-4 px-4 py-2.5 bg-muted/50 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <div />
            <div>Task</div>
            <div>Agent</div>
            <div>Model</div>
            <div>Duration</div>
            <div>Started</div>
          </div>

          {/* Rows */}
          {executions.map((exec: any) => {
            const statusInfo = getStatusInfo(exec.status ?? "pending");
            const isExpanded = expandedIds.has(exec.id);
            const duration = computeDurationLabel(
              exec.executedAt,
              exec.completedAt,
            );
            const agentName = exec.agentName ?? exec.agent?.name ?? `Agent #${exec.agentId}`;
            const agentRole = exec.agentRole ?? exec.agent?.role ?? "";
            const model = exec.modelName ?? exec.agent?.modelName ?? "";
            const taskName = exec.taskTitle ?? exec.task?.title ?? `Task #${exec.taskId}`;

            return (
              <Collapsible
                key={exec.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(exec.id)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full grid grid-cols-[32px_1fr_1fr_140px_80px_100px] gap-4 px-4 py-3 text-left",
                      "hover:bg-accent/50 transition-colors border-b border-border/50",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isExpanded && "bg-accent/30",
                    )}
                  >
                    {/* Status dot */}
                    <div className="flex items-center justify-center">
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0",
                          statusInfo.dotColor,
                          exec.status === "running" && "animate-pulse",
                        )}
                      />
                    </div>

                    {/* Task name */}
                    <div className="flex items-center min-w-0">
                      <span className="text-sm truncate">{taskName}</span>
                    </div>

                    {/* Agent */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">{agentName}</span>
                      {agentRole && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                        >
                          {agentRole}
                        </Badge>
                      )}
                    </div>

                    {/* Model */}
                    <div className="flex items-center min-w-0">
                      <span className="text-xs text-muted-foreground truncate font-mono">
                        {model || "—"}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {duration}
                      </span>
                    </div>

                    {/* Started */}
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground">
                        {exec.executedAt
                          ? formatDistanceToNow(new Date(exec.executedAt), {
                              addSuffix: true,
                            })
                          : "—"}
                      </span>
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 py-4 bg-muted/20 border-b border-border/50 space-y-4">
                    {/* Expand indicator */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <ChevronDown className="h-3 w-3" />
                      <span>Execution Detail</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4 ml-1",
                          statusInfo.color,
                        )}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Input Context */}
                    {exec.inputContext && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          Input Context
                        </p>
                        <pre className="text-xs bg-muted/50 border rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap break-words">
                          {exec.inputContext}
                        </pre>
                      </div>
                    )}

                    {/* Output */}
                    {exec.output && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          Output
                        </p>
                        <div className="border rounded-lg p-3 bg-muted/20 prose prose-sm prose-invert max-w-none overflow-x-auto">
                          <Streamdown>{exec.output}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {exec.status === "failed" && exec.errorMessage && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-red-400 uppercase tracking-wider">
                          Error Details
                        </p>
                        <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
                          <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-words">
                            {exec.errorMessage}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {!isLoading && hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((prev) => prev + limit)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
