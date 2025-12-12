import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Terminal, Play, Zap, Database, Cloud, RefreshCw,
  Download, Upload, Search, Settings, Activity, HardDrive,
  FileText, Clock, Cpu, AlertCircle, CheckCircle, Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// MCP Bridge endpoint
const MCP_BRIDGE_URL = 'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com';

interface QuickCommand {
  id: string;
  name: string;
  shortcut: string;
  icon: React.ReactNode;
  category: 'system' | 'data' | 'sync' | 'debug' | 'workers';
  color: string;
  description: string;
  bashCommand?: string; // Actual bash command to execute
  sqlQuery?: string; // SQL query to execute via Supabase
}

interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

const QuickCommandPanel = () => {
  const { toast } = useToast();
  const [commandInput, setCommandInput] = useState("");
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);

  const commands: QuickCommand[] = [
    { id: 'hb', name: 'Heartbeat', shortcut: '/hb', icon: <Activity className="w-4 h-4" />, category: 'system', color: 'green', description: 'Check system heartbeats', sqlQuery: "SELECT * FROM system_heartbeat ORDER BY timestamp DESC LIMIT 10" },
    { id: 'disk', name: 'Disk Usage', shortcut: '/disk', icon: <HardDrive className="w-4 h-4" />, category: 'system', color: 'blue', description: 'View disk space', bashCommand: 'df -h' },
    { id: 'logs', name: 'View Logs', shortcut: '/logs', icon: <FileText className="w-4 h-4" />, category: 'debug', color: 'purple', description: 'MCP OS logs', bashCommand: 'tail -20 ~/bridge/logs/mcp_os.log' },
    { id: 'queue', name: 'Queue', shortcut: '/queue', icon: <Clock className="w-4 h-4" />, category: 'system', color: 'yellow', description: 'View command queue', sqlQuery: "SELECT * FROM run_queue ORDER BY created_at DESC LIMIT 10" },
    { id: 'status', name: 'Status', shortcut: '/status', icon: <Cpu className="w-4 h-4" />, category: 'system', color: 'cyan', description: 'System status check', bashCommand: 'uptime && echo "---" && ps aux | head -5' },
    { id: 'sync', name: 'Sync All', shortcut: '/sync', icon: <RefreshCw className="w-4 h-4" />, category: 'sync', color: 'orange', description: 'Sync all sources', bashCommand: 'echo "Triggering sync..." && ~/bridge/scripts/sync_all.sh' },
    { id: 'backup', name: 'Backup', shortcut: '/backup', icon: <Download className="w-4 h-4" />, category: 'data', color: 'indigo', description: 'Trigger backup', bashCommand: '~/bridge/scripts/backup.sh' },
    { id: 'deploy', name: 'Deploy', shortcut: '/deploy', icon: <Upload className="w-4 h-4" />, category: 'data', color: 'emerald', description: 'Vercel deploy', bashCommand: 'cd ~/projects/mcp-command-centre && vercel --prod' },
    { id: 'projects', name: 'Projects', shortcut: '/projects', icon: <Database className="w-4 h-4" />, category: 'data', color: 'pink', description: 'List all projects', sqlQuery: "SELECT * FROM holowog_projects WHERE status = 'active'" },
    { id: 'procs', name: 'Processes', shortcut: '/procs', icon: <Terminal className="w-4 h-4" />, category: 'debug', color: 'red', description: 'Running processes', bashCommand: 'ps aux | grep -E "(node|python|mcp)" | head -10' },
    { id: 'workers', name: 'Workers', shortcut: '/workers', icon: <Users className="w-4 h-4" />, category: 'workers', color: 'violet', description: 'Neural Ennead status', sqlQuery: "SELECT COUNT(*) as total_workers, status FROM workers GROUP BY status" },
    { id: 'sqllogs', name: 'SQL Logs', shortcut: '/sqllogs', icon: <Database className="w-4 h-4" />, category: 'debug', color: 'amber', description: 'Recent SQL executions', sqlQuery: "SELECT * FROM sql_execution_log ORDER BY executed_at DESC LIMIT 10" },
  ];

  // Execute SQL via Supabase RPC
  const executeSql = async (query: string): Promise<CommandResult> => {
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        query: query,
        params: {}
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, output: JSON.stringify(data, null, 2) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Execute bash command via MCP Bridge
  const executeBash = async (command: string): Promise<CommandResult> => {
    try {
      const response = await fetch(`${MCP_BRIDGE_URL}/lambda/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'troy-mcp-command',
          payload: { command }
        })
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      return { success: true, output: data.output || JSON.stringify(data) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const executeCommand = async (cmd: QuickCommand | string) => {
    const cmdId = typeof cmd === 'string' ? cmd : cmd.id;
    const cmdName = typeof cmd === 'string' ? cmd : cmd.name;
    const cmdObj = typeof cmd === 'string' ? commands.find(c => c.id === cmd || c.shortcut === cmd) : cmd;

    setIsExecuting(cmdId);
    setRecentCommands(prev => [cmdId, ...prev.filter(c => c !== cmdId)].slice(0, 5));
    setLastResult(null);

    toast({
      title: `Executing ${cmdName}`,
      description: `Running command...`,
    });

    let result: CommandResult;

    if (cmdObj?.sqlQuery) {
      // Execute as SQL query
      result = await executeSql(cmdObj.sqlQuery);
    } else if (cmdObj?.bashCommand) {
      // Execute as bash command via MCP Bridge
      result = await executeBash(cmdObj.bashCommand);
    } else if (typeof cmd === 'string' && !cmdObj) {
      // Raw command - try as bash
      result = await executeBash(cmd);
    } else {
      result = { success: false, error: 'Unknown command' };
    }

    setLastResult(result);
    setIsExecuting(null);

    toast({
      title: result.success ? `${cmdName} Complete` : `${cmdName} Failed`,
      description: result.success ? "Command executed successfully" : result.error,
      variant: result.success ? "default" : "destructive"
    });
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
      case 'workers': return 'bg-violet-500/20 text-violet-400';
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

        {/* Command Output */}
        {lastResult && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">Output</div>
              {lastResult.success ? (
                <Badge className="bg-green-500/20 text-green-400">
                  <CheckCircle className="w-3 h-3 mr-1" /> Success
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400">
                  <AlertCircle className="w-3 h-3 mr-1" /> Error
                </Badge>
              )}
            </div>
            <ScrollArea className="h-[120px]">
              <pre className={`text-xs font-mono p-2 rounded bg-muted/50 whitespace-pre-wrap ${
                lastResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {lastResult.output || lastResult.error}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickCommandPanel;
