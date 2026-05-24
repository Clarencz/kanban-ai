import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ColumnWithTasks } from "@shared/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import KanbanCard from "./KanbanCard";
import ColumnHeader from "./ColumnHeader";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: ColumnWithTasks;
  onTaskMove: (taskId: number, fromColumnId: number, toColumnId: number, newPosition: number) => void;
  onTaskSelect: (taskId: number) => void;
}

export default function KanbanColumn({
  column,
  onTaskMove,
  onTaskSelect,
}: KanbanColumnProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const utils = trpc.useUtils();

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Task created");
      setNewTaskTitle("");
      setIsCreatingTask(false);
      utils.tasks.getByColumn.invalidate({ columnId: column.id });
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTaskMutation.mutateAsync({
      columnId: column.id,
      title: newTaskTitle,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskIdStr = e.dataTransfer.getData("taskId");
    const fromColumnIdStr = e.dataTransfer.getData("fromColumnId");
    
    if (!taskIdStr) return; // Not a task drag

    const taskId = parseInt(taskIdStr);
    const fromColumnId = parseInt(fromColumnIdStr);

    if (taskId && !isNaN(fromColumnId)) {
      const tasks = (column.tasks as any) || [];
      onTaskMove(taskId, fromColumnId, column.id, tasks.length);
    }
  };

  const tasks = (column.tasks as any) || [];

  return (
    <div className="flex-shrink-0 w-80 h-full">
      <Card className={cn(
        "h-full flex flex-col bg-muted/40 border-border/50 transition-colors shadow-none",
        isDragOver && "bg-primary/5 border-primary/50"
      )}>
        <CardHeader className="pb-3 pt-4 px-4 space-y-0 group cursor-grab active:cursor-grabbing">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
              <ColumnHeader columnId={column.id} columnName={column.name} />
            </div>
            <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full min-w-6 text-center">
              {tasks.length}
            </span>
          </div>
        </CardHeader>
        <CardContent
          className="flex-1 flex flex-col gap-3 overflow-y-auto px-3"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col gap-2 min-h-[50px]">
            {tasks.map((task: any, index: any) => (
              <div
                key={task.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const taskId = parseInt(e.dataTransfer.getData("taskId"));
                  const fromColumnId = parseInt(e.dataTransfer.getData("fromColumnId"));
                  if (taskId && !isNaN(fromColumnId)) {
                    onTaskMove(taskId, fromColumnId, column.id, index);
                  }
                }}
              >
                <KanbanCard
                  task={task}
                  columnId={column.id}
                  index={index}
                  onTaskMove={onTaskMove}
                  onTaskSelect={onTaskSelect}
                />
              </div>
            ))}
          </div>

          <div className="mt-auto pt-2">
            {isCreatingTask ? (
              <div className="space-y-2 p-1">
                <Input
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTask();
                    if (e.key === "Escape") setIsCreatingTask(false);
                  }}
                  autoFocus
                  className="bg-background shadow-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleCreateTask}
                    disabled={createTaskMutation.isPending}
                    className="flex-1"
                  >
                    {createTaskMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCreatingTask(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingTask(true)}
                className="w-full text-muted-foreground justify-start hover:bg-muted/60"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create task
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
