import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Circle,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight,
  Play,
  Terminal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Streamdown } from "streamdown";

interface ExecutionPipelineProps {
  executions: Array<{
    id: number;
    agentId: number;
    executionOrder: number;
    inputContext: string | null;
    output: string | null;
    status: string;
    errorMessage: string | null;
    executedAt: Date | string | null;
    completedAt: Date | string | null;
  }>;
  compact?: boolean;
  onRerun?: (agentId: number) => void;
  isRerunning?: boolean;
  agentNames?: Record<number, { name: string; model: string }>;
}

const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof Circle;
    animation?: string;
    label: string;
  }
> = {
  pending: {
    color: "text-gray-400",
    bgColor: "bg-gray-500",
    borderColor: "border-gray-500/30",
    icon: Circle,
    label: "Pending",
  },
  running: {
    color: "text-blue-400",
    bgColor: "bg-blue-500",
    borderColor: "border-blue-500/30",
    icon: Loader2,
    animation: "animate-spin",
    label: "Running",
  },
  completed: {
    color: "text-green-400",
    bgColor: "bg-green-500",
    borderColor: "border-green-500/30",
    icon: CheckCircle,
    label: "Completed",
  },
  failed: {
    color: "text-red-400",
    bgColor: "bg-red-500",
    borderColor: "border-red-500/30",
    icon: XCircle,
    label: "Failed",
  },
  retrying: {
    color: "text-amber-400",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-500/30",
    icon: RefreshCw,
    animation: "animate-spin",
    label: "Retrying",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      color: "text-gray-400",
      bgColor: "bg-gray-500",
      borderColor: "border-gray-500/30",
      icon: Circle,
      label: status,
    }
  );
}

function computeDuration(
  executedAt: Date | string | null,
  completedAt: Date | string | null,
): string | null {
  if (!executedAt) return null;
  const start = new Date(executedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;

  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`;
}

// ───────────────────────────────────────────
// Compact Mode — Horizontal dot pipeline
// ───────────────────────────────────────────
function CompactPipeline({
  executions,
  agentNames,
}: Pick<ExecutionPipelineProps, "executions" | "agentNames">) {
  const display = executions.slice(-5);

  if (display.length === 0) {
    return (
      <div className="flex items-center gap-1">
        <Circle className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/50">
          No executions
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {display.map((exec, i) => {
        const config = getStatusConfig(exec.status);
        const duration = computeDuration(exec.executedAt, exec.completedAt);
        const agentInfo = agentNames?.[exec.agentId];
        const tooltipLabel = [
          agentInfo?.name ?? `Agent #${exec.agentId}`,
          duration,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <div key={exec.id} className="flex items-center">
            {i > 0 && (
              <div className="h-px w-2 bg-muted-foreground/20 shrink-0" />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0 transition-colors",
                    config.bgColor,
                    exec.status === "running" && "animate-pulse",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tooltipLabel}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      })}
      {executions.length > 5 && (
        <span className="ml-1 text-[10px] text-muted-foreground">
          +{executions.length - 5}
        </span>
      )}
    </div>
  );
}

// ───────────────────────────────────────────
// Full Mode — Vertical timeline
// ───────────────────────────────────────────
function FullPipeline({
  executions,
  agentNames,
  onRerun,
  isRerunning,
}: Omit<ExecutionPipelineProps, "compact">) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

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

  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Terminal className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No executions yet</p>
        <p className="text-xs opacity-60">
          Run an agent to see the pipeline here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {executions.map((exec, i) => {
        const config = getStatusConfig(exec.status);
        const StatusIcon = config.icon;
        const agentInfo = agentNames?.[exec.agentId];
        const duration = computeDuration(exec.executedAt, exec.completedAt);
        const isExpanded = expandedIds.has(exec.id);
        const isLast = i === executions.length - 1;

        return (
          <div key={exec.id} className="relative flex gap-3">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-border" />
            )}

            {/* Status icon */}
            <div className="relative z-10 shrink-0 mt-1">
              <StatusIcon
                className={cn("h-[22px] w-[22px]", config.color, config.animation)}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleExpanded(exec.id)}
              >
                {/* Header */}
                <div className="flex items-center gap-2 group">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1.5 hover:text-foreground transition-colors text-left min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {agentInfo?.name ?? `Agent #${exec.agentId}`}
                      </span>
                    </button>
                  </CollapsibleTrigger>

                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                  >
                    {config.label}
                  </Badge>

                  {agentInfo?.model && (
                    <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                      {agentInfo.model}
                    </span>
                  )}

                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    {duration && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {duration}
                      </span>
                    )}

                    {exec.executedAt && (
                      <span className="text-[11px] text-muted-foreground hidden md:inline">
                        {formatDistanceToNow(new Date(exec.executedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}

                    {onRerun && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRerun(exec.agentId)}
                        disabled={isRerunning}
                      >
                        {isRerunning ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                <CollapsibleContent>
                  <div className="mt-3 space-y-3">
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
                          Error
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────
// Main export
// ───────────────────────────────────────────
export default function ExecutionPipeline(props: ExecutionPipelineProps) {
  const { compact = false, ...rest } = props;

  if (compact) {
    return (
      <CompactPipeline
        executions={rest.executions}
        agentNames={rest.agentNames}
      />
    );
  }

  return <FullPipeline {...rest} />;
}
