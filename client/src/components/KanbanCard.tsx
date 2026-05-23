import { Task as TaskType } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface KanbanCardProps {
  task: TaskType;
  columnId: number;
  index: number;
  onTaskMove: (taskId: number, fromColumnId: number, toColumnId: number, newPosition: number) => void;
  onTaskSelect: (taskId: number) => void;
}

const PRIORITY_COLORS = {
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function KanbanCard({
  task,
  columnId,
  index,
  onTaskMove,
  onTaskSelect,
}: KanbanCardProps) {
  const { data: agent } = trpc.agents.get.useQuery(
    { agentId: task.assignedAgentId! },
    { enabled: !!task.assignedAgentId }
  );

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.setData("fromColumnId", columnId.toString());
    e.dataTransfer.setData("fromIndex", index.toString());
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onClick={() => onTaskSelect(task.id)}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        "bg-background border-border hover:border-primary/50"
      )}
    >
      <div className="space-y-2">
        <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={cn("text-xs", PRIORITY_COLORS[task.priority])}
          >
            {task.priority}
          </Badge>
          {task.status && task.status !== "pending" && (
            <Badge variant="outline" className="text-xs">
              {task.status}
            </Badge>
          )}
        </div>
        {agent && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <Bot className="w-3 h-3" />
            <span className="truncate">{agent.name}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
