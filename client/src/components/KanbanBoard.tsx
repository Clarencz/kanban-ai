import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { ColumnWithTasks } from "@shared/types";
import KanbanColumn from "./KanbanColumn";
import { toast } from "sonner";

interface KanbanBoardProps {
  boardId: number;
  columns: ColumnWithTasks[];
  onTaskSelect: (taskId: number) => void;
}

export default function KanbanBoard({
  boardId,
  columns: initialColumns,
  onTaskSelect,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const utils = trpc.useUtils();

  const moveTaskMutation = trpc.tasks.move.useMutation({
    onError: (error: { message: string }) => {
      toast.error(error.message);
      // Revert optimistic update
      utils.boards.getWithColumns.invalidate({ boardId });
    },
  });

  const handleTaskMove = useCallback(
    (taskId: number, fromColumnId: number, toColumnId: number, newPosition: number) => {
      // Optimistic update
      const updatedColumns = columns.map((col) => {
        if (col.id === fromColumnId) {
          return {
            ...col,
            tasks: (col.tasks as any)?.filter((t: any) => t.id !== taskId) || [],
          };
        }
        if (col.id === toColumnId) {
          const task = columns
            .find((c) => c.id === fromColumnId)
            ?.tasks?.find((t: any) => t.id === taskId);
          if (task) {
            const newTasks = [...((col.tasks as any) || [])];
            newTasks.splice(newPosition, 0, task);
            return {
              ...col,
              tasks: newTasks,
            };
          }
        }
        return col;
      });
      setColumns(updatedColumns);

      // Send to server
      moveTaskMutation.mutate({
        taskId,
        columnId: toColumnId,
        position: newPosition,
      });
    },
    [columns, moveTaskMutation]
  );

  return (
    <div className="flex gap-6 pb-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          onTaskMove={handleTaskMove}
          onTaskSelect={onTaskSelect}
        />
      ))}
    </div>
  );
}
