import { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import KanbanBoard from "@/components/KanbanBoard";
import TaskDetailPanel from "@/components/TaskDetailPanel";

export default function BoardPage() {
  const [, params] = useRoute("/boards/:boardId");
  const boardId = params?.boardId ? parseInt(params.boardId) : null;
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const { data: board, isLoading } = trpc.boards.getWithColumns.useQuery(
    { boardId: boardId || 0 },
    { enabled: !!boardId }
  );

  const createColumnMutation = trpc.columns.create.useMutation({
    onSuccess: () => {
      toast.success("Column created");
      setNewColumnName("");
      setIsCreatingColumn(false);
      utils.boards.getWithColumns.invalidate({ boardId: boardId! });
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const utils = trpc.useUtils();

  const handleCreateColumn = async () => {
    if (!newColumnName.trim() || !boardId) return;
    await createColumnMutation.mutateAsync({
      boardId,
      name: newColumnName,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!board || !boardId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Board not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{board.name}</h1>
          {board.description && (
            <p className="text-muted-foreground mt-1">{board.description}</p>
          )}
        </div>
        <Dialog open={isCreatingColumn} onOpenChange={setIsCreatingColumn}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Column
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Column</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Column name (e.g., Backlog, In Progress)"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateColumn();
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingColumn(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateColumn}
                  disabled={createColumnMutation.isPending}
                >
                  {createColumnMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto">
        <KanbanBoard
          boardId={boardId}
          columns={board.columns || []}
          onTaskSelect={setSelectedTaskId}
        />
      </div>

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
