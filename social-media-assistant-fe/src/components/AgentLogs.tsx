import { Card } from "./ui/card";

export default function AgentLogs({ logs }: { logs: any }) {
  return (
    <Card className="h-full w-full bg-gray-50 border-none shadow-none">
      <h2 className="text-lg font-semibold mb-4">Agent Logs</h2>
      <pre className="bg-white rounded p-4 text-xs text-gray-700 overflow-auto max-h-[70vh] border">
        {JSON.stringify(logs, null, 2)}
      </pre>
    </Card>
  );
} 