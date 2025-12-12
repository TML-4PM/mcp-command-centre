import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Terminal, Play, Zap, Database, Cloud, RefreshCw,
  Download, Upload, Search, Settings, Activity, HardDrive,
  FileText, Clock, Cpu, AlertCircle, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickCommand {
  id: string;
  name: string;
  shortcut: string;
  icon: React.ReactNode;
  category: 'system' | 'data' | 'sync' | 'debug';
  color: string;
  description: string;
}

const QuickCommandPanel = () => {
  const { toast } = useToast();
  const [commandInput, setCommandInput] = useState("");
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const commands: QuickCommand[] = [
    { id: 'hb', name: 'Heartbeat', shortcut: '/hb', icon: <Activity className="w-4 h-4" />, category: 'system', color: 'green', description: 'Check system heartbeats' },
    { id: 'disk', name: 'Disk Usage', shortcut: '/disk', icon: <HardDrive className="w-4 h-4" />, category: 'system', color: 'blue', description: 'View disk space' },
    { id: 'logs', name: 'View Logs', shortcut: '/logs', icon: <FileText className="w-4 h-4" />, category: 'debug', color: 'purple', description: 'MCP OS logs' },
    { id: 'queue', name: 'Queue', shortcut: '/queue', icon: <Clock className="w-4 h-4" />, category: 'system', color: 'yellow', description: 'View command queue' },
    { id: 'status', name: 'Status', shortcut: '/status', icon: <Cpu className="w-4 h-4" />, category: 'system', color: 'cyan', description: 'System status check' },
    { id: 'sync', name: 'Sync All', shortcut: '/sync', icon: <RefreshCw className="w-4 h-4" />, category: 'sync', color: 'orange', description: 'Sync all sources' },
    { id: 'backup', name: 'Backup', shortcut: '/backup', icon: <Download className="w-4 h-4" />, category: 'data', color: 'indigo', description: 'Trigger backup' },
    { id: 'deploy', name: 'Deploy', shortcut: '/deploy', icon: <Upload className="w-4 h-4" />, category: 'data', color: 'emerald', description: 'Vercel deploy' },
    { id: 'search', name: 'Search', shortcut: '/search', icon: <Search className="w-4 h-4" />, category: 'data', color: 'pink', description: 'Search all data' },
    { id: 'procs', name: 'Processes', shortcut: '/procs', icon: <Terminal className="w-4 h-4" />, category: 'debug', color: 'red', description: 'Running processes' },
  ];

  const executeCommand = async (cmd: QuickCommand | string) => {
    const cmdId = typeof cmd === 'string' ? cmd : cmd.id;
    const cmdName = typeof cmd === 'string' ? cmd : cmd.name;

    setIsExecuting(cmdId);
    setRecentCommands(prev => [cmdId, ...prev.filter(c => c !== cmdId)].slice(0, 5));

    toast({
      title: `Executing ${cmdName}`,
      description: `Running command...`,
    });

    // Simulate execution - in production, this would call the actual API
    setTimeout(() => {
      setIsExecuting(null);
      toast({
        title: `${cmdName} Complete`,
        description: "Command executed successfully",
      });
    }, 1500);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      const cmdText = commandInput.trim();
      // Check if it matches a shortcut
      const matchedCmd = commands.find(c =>
        c.shortcut === cmdText || c.shortcut === `/${cmdText}` || c.id === cmdText
      );

      if (matchedCmd) {
        executeCommand(matchedCmd);
      } else {
        // Execute as raw command
        executeCommand(cmdText);
      }
      setCommandInput("");
    }
  };

  const getCategoryColor = (category: QuickCommand['category']) => {
    switch (category) {
      case 'system': return 'bg-blue-500/20 text-blue-400';
      case 'data': return 'bg-green-500/20 text-green-400';
      case 'sync': return 'bg-orange-500/20 text-orange-400';
      case 'debug': return 'bg-purple-500/20 text-purple-400';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          Quick Commands
        </CardTitle>
        <CardDescription>Execute shortcuts and automation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Command Input */}
        <form onSubmit={handleInputSubmit}>
          <div className="flex gap-2">
            <Input
              placeholder="Type command or /shortcut..."
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="font-mono text-sm"
            />
            <Button type="submit" size="icon">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Quick Access Buttons */}
        <ScrollArea className="h-[220px]">
          <div className="grid grid-cols-2 gap-2">
            {commands.map(cmd => (
              <Button
                key={cmd.id}
                variant="outline"
                className={`h-auto py-3 px-3 justify-start gap-2 ${
                  isExecuting === cmd.id ? 'border-primary bg-primary/10' : ''
                }`}
                onClick={() => executeCommand(cmd)}
                disabled={isExecuting === cmd.id}
              >
                <div className={`p-1.5 rounded ${getCategoryColor(cmd.category)}`}>
                  {isExecuting === cmd.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    cmd.icon
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{cmd.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{cmd.shortcut}</div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Recent Commands */}
        {recentCommands.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Recent</div>
            <div className="flex flex-wrap gap-1">
              {recentCommands.map((cmdId, idx) => {
                const cmd = commands.find(c => c.id === cmdId);
                return (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => cmd && executeCommand(cmd)}
                  >
                    {cmd?.shortcut || cmdId}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickCommandPanel;
