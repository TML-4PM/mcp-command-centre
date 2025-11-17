import { useToast } from "@/hooks/use-toast";

const Commands = () => {
  const { toast } = useToast();

  const executeCommand = (cmd: string) => {
    toast({
      title: `Executing: ${cmd}`,
      description: "This would trigger your MCP Bridge endpoint."
    });
  };

  const commands = [
    { id: 'sync-github', icon: '🔄', title: 'Sync GitHub Repos', description: 'Update all 107 repositories', color: 'blue' },
    { id: 'daily-report', icon: '📊', title: 'Generate Daily Report', description: 'Create comprehensive metrics', color: 'purple' },
    { id: 'search-conversations', icon: '🔍', title: 'Search Conversations', description: 'Full-text search 76K+ items', color: 'green' },
    { id: 'find-tasks', icon: '✅', title: 'Find Tasks (@@@@@)', description: 'Discover unfinished work', color: 'yellow' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Command Centre</h1>
        <p className="text-muted-foreground mt-2">Execute 75+ automation commands with one click</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {commands.map((command) => (
          <button
            key={command.id}
            onClick={() => executeCommand(command.id)}
            className="p-6 glass rounded-lg hover:border-primary transition-all text-left border border-border group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{command.icon}</div>
            <div className="font-semibold mb-1">{command.title}</div>
            <div className="text-sm text-muted-foreground">{command.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Commands;
