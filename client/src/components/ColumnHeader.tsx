import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ColumnHeaderProps {
  columnId: number;
  columnName: string;
  onRenamed?: () => void;
  onDeleted?: () => void;
}

export default function ColumnHeader({
  columnId,
  columnName,
  onRenamed,
  onDeleted,
}: ColumnHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(columnName);
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = trpc.useUtils();

  const updateMutation = trpc.columns.update.useMutation({
    onSuccess: () => {
      toast.success("Column renamed");
      setIsRenaming(false);
      utils.boards.getWithColumns.invalidate();
      onRenamed?.();
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.columns.delete.useMutation({
    onSuccess: () => {
      toast.success("Column deleted");
      setIsDeleting(false);
      utils.boards.getWithColumns.invalidate();
      onDeleted?.();
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Column name cannot be empty");
      return;
    }
    await updateMutation.mutateAsync({
      columnId,
      name: newName,
    });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ columnId });
  };

  if (isRenaming) {
    return (
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          autoFocus
          className="h-8"
        />
        <Button
          size="sm"
          onClick={handleRename}
          disabled={updateMutation.isPending}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsRenaming(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-medium text-sm">{columnName}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                <span className="text-destructive">Delete</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Column</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this column? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleting(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
