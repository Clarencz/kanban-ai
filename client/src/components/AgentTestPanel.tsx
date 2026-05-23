import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface AgentTestPanelProps {
  agentId: number;
}

export default function AgentTestPanel({ agentId }: AgentTestPanelProps) {
  const [testPrompt, setTestPrompt] = useState("Hello, please introduce yourself.");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; response?: string; error?: string } | null>(null);

  const { data: agent } = trpc.agents.get.useQuery({ agentId });
  const { data: provider } = trpc.providers.get.useQuery(
    agent?.providerId ? { providerId: agent.providerId } : { providerId: 0 },
    { enabled: !!agent?.providerId }
  );

  const testMutation = trpc.execution.testAgent.useMutation();

  const handleTest = async () => {
    if (!testPrompt.trim()) {
      toast.error("Please enter a test prompt");
      return;
    }

    setIsLoading(true);
    try {
      const result = await testMutation.mutateAsync({
        agentId,
        testPrompt: testPrompt,
      });
      setTestResult({ success: true, response: result.response });
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!agent || !provider || !agent.providerId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading agent information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <p className="font-medium">Agent:</p>
            <p className="text-muted-foreground">{agent.name}</p>
          </div>
          <div>
            <p className="font-medium">Provider:</p>
            <p className="text-muted-foreground">{provider.name}</p>
          </div>
          <div>
            <p className="font-medium">Model:</p>
            <p className="text-muted-foreground">{agent.modelName}</p>
          </div>
          <div>
            <p className="font-medium">Role:</p>
            <p className="text-muted-foreground">{agent.role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Test Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Test Prompt</label>
            <Input
              placeholder="Enter a test message for the agent..."
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleTest}
            disabled={isLoading || testMutation.isPending}
            className="w-full"
          >
            {isLoading || testMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Test"
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Test Result</CardTitle>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Test Successful!</p>
                <div className="bg-muted p-3 rounded text-sm max-h-64 overflow-y-auto">
                  <Streamdown>{testResult.response}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Test Failed</p>
                <p className="text-sm text-muted-foreground">{testResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
