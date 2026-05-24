import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function AgentsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    providerId: 0,
    name: "",
    role: "",
    modelName: "",
    systemPrompt: "",
  });

  const { data: agents, isLoading } = trpc.agents.list.useQuery();
  const { data: providers } = trpc.providers.list.useQuery();
  const selectedProvider = providers?.find((p) => p.id === formData.providerId);
  const { data: availableModels } = trpc.providers.getAvailableModels.useQuery(
    { type: (selectedProvider?.type as any) },
    { enabled: !!selectedProvider },
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.agents.create.useMutation({
    onSuccess: () => {
      toast.success("Agent created");
      resetForm();
      setIsCreating(false);
      utils.agents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.agents.update.useMutation({
    onSuccess: () => {
      toast.success("Agent updated");
      resetForm();
      setEditingId(null);
      utils.agents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.agents.delete.useMutation({
    onSuccess: () => {
      toast.success("Agent deleted");
      utils.agents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      providerId: 0,
      name: "",
      role: "",
      modelName: "",
      systemPrompt: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.providerId || !formData.name || !formData.role || !formData.modelName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      await updateMutation.mutateAsync({
        agentId: editingId,
        name: formData.name,
        role: formData.role,
        modelName: formData.modelName,
        systemPrompt: formData.systemPrompt,
      });
    } else {
      await createMutation.mutateAsync({
        providerId: formData.providerId,
        name: formData.name,
        role: formData.role,
        modelName: formData.modelName,
        systemPrompt: formData.systemPrompt,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your AI agents for task collaboration
          </p>
        </div>
        <Dialog open={isCreating || !!editingId} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingId(null);
            resetForm();
          } else {
            setIsCreating(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Agent" : "Create New Agent"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Provider</label>
                <Select
                  value={formData.providerId.toString()}
                  onValueChange={(val) => setFormData({ ...formData, providerId: parseInt(val) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Agent Name</label>
                <Input
                  placeholder="e.g., Code Reviewer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role</label>
                <Input
                  placeholder="e.g., Reviewer, Planner, Coder"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Model</label>
                <Select
                  value={formData.modelName}
                  onValueChange={(val) => setFormData({ ...formData, modelName: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels?.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">System Prompt (optional)</label>
                <Textarea
                  placeholder="Define the agent's behavior and instructions..."
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  className="mt-1 min-h-24"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Update Agent"
                  ) : (
                    "Create Agent"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <CardTitle className="line-clamp-1">{agent.name}</CardTitle>
                <CardDescription>{agent.role}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-sm font-medium">{agent.modelName}</p>
                </div>
                {agent.systemPrompt && (
                  <div>
                    <p className="text-xs text-muted-foreground">System Prompt</p>
                    <p className="text-sm line-clamp-2">{agent.systemPrompt}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        providerId: agent.providerId,
                        name: agent.name,
                        role: agent.role,
                        modelName: agent.modelName,
                        systemPrompt: agent.systemPrompt || "",
                      });
                      setEditingId(agent.id);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate({ agentId: agent.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No agents yet</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
