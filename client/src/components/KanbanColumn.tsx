import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ColumnWithTasks } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
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

    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const fromColumnId = parseInt(e.dataTransfer.getData("fromColumnId"));

    if (taskId && fromColumnId !== undefined) {
      const tasks = (column.tasks as any) || [];
      onTaskMove(taskId, fromColumnId, column.id, tasks.length);
    }
  };

  const tasks = (column.tasks as any) || [];

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={cn(
        "h-full flex flex-col bg-card border-border transition-colors",
        isDragOver && "bg-primary/5 border-primary/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <ColumnHeader columnId={column.id} columnName={column.name} />
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
              {tasks.length}
            </span>
          </div>
        </CardHeader>
        <CardContent
          className="flex-1 flex flex-col gap-3 overflow-y-auto"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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
                if (taskId && fromColumnId !== undefined) {
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

          {isCreatingTask ? (
            <div className="space-y-2">
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask();
                  if (e.key === "Escape") setIsCreatingTask(false);
                }}
                autoFocus
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
                  variant="outline"
                  onClick={() => setIsCreatingTask(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingTask(true)}
              className="w-full text-muted-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
