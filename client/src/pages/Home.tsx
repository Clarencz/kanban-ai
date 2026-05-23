import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Kanban } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");

  const { data: boards, isLoading } = trpc.boards.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createBoardMutation = trpc.boards.create.useMutation({
    onSuccess: (result: { insertId?: number } | unknown) => {
      toast.success("Board created");
      setNewBoardName("");
      setNewBoardDescription("");
      setIsCreatingBoard(false);
      utils.boards.list.invalidate();
      // Navigate to the new board
      if ((result as any).insertId) {
        setLocation(`/boards/${(result as any).insertId}`);
      }
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const utils = trpc.useUtils();

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error("Board name is required");
      return;
    }
    await createBoardMutation.mutateAsync({
      name: newBoardName,
      description: newBoardDescription,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <Kanban className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-4xl font-bold">Kanban AI Agents</h1>
            <p className="text-lg text-muted-foreground">
              Collaborate with AI agents on your projects
            </p>
          </div>
          <Button size="lg" onClick={() => setLocation("/login")}>
            Sign In to Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || "User"}</h1>
        <p className="text-muted-foreground mt-2">
          Manage your projects with AI-powered collaboration
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Boards</h2>
        <Dialog open={isCreatingBoard} onOpenChange={setIsCreatingBoard}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Board Name</label>
                <Input
                  placeholder="e.g., Product Development"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  placeholder="Describe your board..."
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingBoard(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBoard}
                  disabled={createBoardMutation.isPending}
                >
                  {createBoardMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Board"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board: { id: number; name: string; description: string | null; createdAt: Date | string }) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation(`/boards/${board.id}`)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-1">{board.name}</CardTitle>
                {board.description && (
                  <CardDescription className="line-clamp-2">
                    {board.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Kanban className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No boards yet</p>
            <Button onClick={() => setIsCreatingBoard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Board
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
