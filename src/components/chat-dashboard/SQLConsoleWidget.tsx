import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Database, Play, Copy, Download, RefreshCw, Clock,
  CheckCircle, AlertCircle, FileText, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount?: number;
  executionTime?: number;
}

interface SavedQuery {
  id: string;
  name: string;
  query: string;
}

const SQLConsoleWidget = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const quickQueries: SavedQuery[] = [
    { id: '1', name: 'Active Projects', query: "SELECT * FROM holowog_projects WHERE status = 'active'" },
    { id: '2', name: 'Recent Tasks', query: "SELECT * FROM run_queue ORDER BY created_at DESC LIMIT 10" },
    { id: '3', name: 'SQL Logs', query: "SELECT * FROM sql_execution_log ORDER BY executed_at DESC LIMIT 10" },
    { id: '4', name: 'System Heartbeat', query: "SELECT * FROM system_heartbeat ORDER BY timestamp DESC LIMIT 10" },
    { id: '5', name: 'Conversations Count', query: "SELECT COUNT(*) as total FROM conversations" },
    { id: '6', name: 'Code Blocks Count', query: "SELECT COUNT(*) as total FROM code_blocks" },
    { id: '7', name: 'Table Sizes', query: "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10" },
    { id: '8', name: 'Workers Summary', query: "SELECT status, COUNT(*) as count FROM workers GROUP BY status" },
  ];

  const executeQuery = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setResult(null);
    const startTime = Date.now();

    try {
      // Use the execute_sql RPC function
      const { data, error } = await supabase.rpc('execute_sql', {
        query: query.trim(),
        params: {}
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        setResult({
          success: false,
          error: error.message,
          executionTime
        });
        toast({
          title: "Query Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const rows = Array.isArray(data) ? data : [data];
        setResult({
          success: true,
          data: rows,
          rowCount: rows.length,
          executionTime
        });

        // Add to history
        setQueryHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 10));

        toast({
          title: "Query Executed",
          description: `${rows.length} row(s) returned in ${executionTime}ms`,
        });
      }
    } catch (err: any) {
      const executionTime = Date.now() - startTime;
      setResult({
        success: false,
        error: err.message,
        executionTime
      });
      toast({
        title: "Query Failed",
        description: err.message,
        variant: "destructive"
      });
    }

    setIsExecuting(false);
  };

  const copyResults = () => {
    if (result?.data) {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      toast({ title: "Copied", description: "Results copied to clipboard" });
    }
  };

  const downloadResults = () => {
    if (result?.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_results_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const loadQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query);
  };

  const clearResults = () => {
    setResult(null);
    setQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              SQL Console
            </CardTitle>
            <CardDescription>Execute queries via execute_sql() RPC</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Queries */}
        <div>
          <div className="text-sm font-medium mb-2">Quick Queries</div>
          <div className="flex flex-wrap gap-2">
            {quickQueries.map(q => (
              <Button
                key={q.id}
                variant="outline"
                size="sm"
                onClick={() => loadQuery(q)}
                className="text-xs"
              >
                {q.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="SELECT * FROM table_name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-mono text-sm min-h-[100px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                executeQuery();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Cmd/Ctrl + Enter to execute
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearResults}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button size="sm" onClick={executeQuery} disabled={isExecuting || !query.trim()}>
                {isExecuting ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                Execute
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
                {result.rowCount !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {result.rowCount} row(s)
                  </span>
                )}
                {result.executionTime !== undefined && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.executionTime}ms
                  </span>
                )}
              </div>
              {result.success && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyResults}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadResults}>
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-[300px] rounded border border-border">
              <pre className={`p-3 text-xs font-mono whitespace-pre-wrap ${
                result.success ? 'text-foreground' : 'text-red-400'
              }`}>
                {result.success
                  ? JSON.stringify(result.data, null, 2)
                  : result.error
                }
              </pre>
            </ScrollArea>
          </div>
        )}

        {/* Query History */}
        {queryHistory.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              History
            </div>
            <ScrollArea className="h-[100px]">
              <div className="space-y-1">
                {queryHistory.map((q, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-mono p-2 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer truncate"
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SQLConsoleWidget;
