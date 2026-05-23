import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import AIChatBox from "./AIChatBoxKanban";

interface TaskDetailPanelProps {
  taskId: number;
  onClose: () => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
const STATUS_OPTIONS = ["pending", "in_progress", "completed", "blocked"] as const;

export default function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const { data: task, isLoading } = trpc.tasks.get.useQuery({ taskId });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task?.title || "");
  const [editDescription, setEditDescription] = useState(task?.description || "");
  const [editPriority, setEditPriority] = useState(task?.priority || "medium");
  const [editStatus, setEditStatus] = useState(task?.status || "pending");
  const utils = trpc.useUtils();

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      setIsEditing(false);
      utils.tasks.get.invalidate({ taskId });
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const handleSaveChanges = async () => {
    await updateTaskMutation.mutateAsync({
      taskId,
      title: editTitle,
      description: editDescription,
      priority: editPriority as any,
      status: editStatus as any,
    });
  };

  if (isLoading) {
    return (
      <Drawer open={true} onOpenChange={onClose}>
        <DrawerContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <Drawer open={true} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>Task Details</DrawerTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-6 pb-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="ai">AI Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="mt-1 min-h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={editPriority} onValueChange={(val) => setEditPriority(val as any)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={editStatus} onValueChange={(val) => setEditStatus(val as any)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace(/_/g, " ").charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={updateTaskMutation.isPending}
                    >
                      {updateTaskMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{task.title}</h2>
                  </div>

                  {task.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{task.priority}</Badge>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                    <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
                  </div>

                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    Edit Task
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="mt-6 h-96">
              <AIChatBox taskId={taskId} />
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
