import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ColumnWithTasks } from "@shared/types";
import KanbanColumn from "./KanbanColumn";
import { toast } from "sonner";
import { Reorder } from "framer-motion";

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

  // Update local state when initialColumns change (e.g. after a refetch)
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const moveTaskMutation = trpc.tasks.move.useMutation({
    onError: (error: { message: string }) => {
      toast.error(error.message);
      // Revert optimistic update
      utils.boards.getWithColumns.invalidate({ boardId });
    },
  });

  const reorderColumnsMutation = trpc.columns.reorder.useMutation({
    onSuccess: () => {
      utils.boards.getWithColumns.invalidate({ boardId });
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
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

  const handleColumnReorder = (newColumns: ColumnWithTasks[]) => {
    setColumns(newColumns);
    reorderColumnsMutation.mutate({
      boardId,
      columnIds: newColumns.map((c) => c.id),
    });
  };

  return (
    <Reorder.Group
      axis="x"
      values={columns}
      onReorder={handleColumnReorder}
      className="flex gap-6 pb-4 overflow-x-auto min-h-[calc(100vh-12rem)]"
    >
      {columns.map((column) => (
        <Reorder.Item
          key={column.id}
          value={column}
          className="flex-shrink-0"
          dragTransition={{ bounceStiffness: 500, bounceDamping: 20 }}
        >
          <KanbanColumn
            column={column}
            onTaskMove={handleTaskMove}
            onTaskSelect={onTaskSelect}
          />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
