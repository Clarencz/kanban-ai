import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, Edit2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ProvidersPage() {
  const { data: catalog } = trpc.providers.catalog.useQuery();
  const catalogById = new Map((catalog ?? []).map((p) => [p.id, p]));
  const PROVIDER_TYPES = (catalog ?? []).map((p) => ({
    value: p.id,
    label: p.name,
    description: p.description,
    country: p.country,
    kind: p.kind,
    unsupportedRuntime: p.unsupportedRuntime,
    notes: p.notes,
  }));
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const { data: providers, isLoading } = trpc.providers.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.providers.create.useMutation({
    onSuccess: () => {
      toast.success("Provider added");
      resetForm();
      setIsCreating(false);
      utils.providers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.providers.update.useMutation({
    onSuccess: () => {
      toast.success("Provider updated");
      resetForm();
      setEditingId(null);
      utils.providers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.providers.delete.useMutation({
    onSuccess: () => {
      toast.success("Provider deleted");
      utils.providers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const validateMutation = trpc.providers.validateKey.useMutation({
    onSuccess: () => {
      toast.success("API key is valid");
      setIsValidating(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsValidating(false);
    },
  });

  const resetForm = () => {
    setSelectedType("");
    setApiKey("");
  };

  const handleSubmit = async () => {
    if (!selectedType || !apiKey) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingId) {
      await updateMutation.mutateAsync({
        providerId: editingId,
        apiKey,
      });
    } else {
      await createMutation.mutateAsync({
        type: selectedType as any,
        apiKey,
      });
    }
  };

  const handleValidate = async () => {
    if (!selectedType || !apiKey) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsValidating(true);
    await validateMutation.mutateAsync({
      type: selectedType as any,
      apiKey,
    });
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
          <h1 className="text-3xl font-bold">LLM Providers</h1>
          <p className="text-muted-foreground mt-1">
            Connect your free LLM provider API keys
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
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Update API Key" : "Add New Provider"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingId && (
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_TYPES.map((p) => (
                        <SelectItem key={p.value} value={p.value} disabled={p.unsupportedRuntime}>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <span>{p.label}</span>
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.country}</span>
                              {p.unsupportedRuntime && (
                                <span className="text-[10px] uppercase tracking-wide text-amber-500">runtime n/a</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{p.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="Paste your API key here"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
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
                  variant="outline"
                  onClick={handleValidate}
                  disabled={isValidating || validateMutation.isPending}
                >
                  {isValidating || validateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Validate"
                  )}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Add Provider"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {providers && providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => {
            const info = catalogById.get(provider.type);
            const models = info?.models ?? [];
            return (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        <span className="truncate">{info?.name || provider.name}</span>
                        {info?.country && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {info.country}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{info?.description}</CardDescription>
                    </div>
                    {provider.isActive && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">API key</p>
                      <p className="text-sm font-medium">
                        {provider.apiKey === "***" ? "Configured" : "Not configured"}
                      </p>
                    </div>
                    {info?.unsupportedRuntime && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-500">
                        runtime n/a
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Models{models.length > 0 ? ` (${models.length})` : ""}
                    </p>
                    {models.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {models.slice(0, 8).map((m) => (
                          <Badge
                            key={m}
                            variant="secondary"
                            className="font-mono text-[10px] px-1.5 py-0"
                          >
                            {m}
                          </Badge>
                        ))}
                        {models.length > 8 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            +{models.length - 8} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Loading…
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedType(provider.type);
                        setApiKey("");
                        setEditingId(provider.id);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ providerId: provider.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No providers configured</p>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Add at least one LLM provider to create agents
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
