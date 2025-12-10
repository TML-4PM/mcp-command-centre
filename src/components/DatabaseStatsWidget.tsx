import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Database, FolderKanban, CheckSquare, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stats {
  projects: number;
  tasks: number;
  queries: number;
  lastQuery: string | null;
}

export default function DatabaseStatsWidget() {
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    tasks: 0,
    queries: 0,
    lastQuery: null
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, queriesRes] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('query_history').select('*', { count: 'exact', head: true })
      ]);

      const { data: lastQueryData } = await supabase
        .from('query_history')
        .select('query')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        projects: projectsRes.count || 0,
        tasks: tasksRes.count || 0,
        queries: queriesRes.count || 0,
        lastQuery: lastQueryData?.query || null
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const statItems = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'text-blue-500' },
    { label: 'Tasks', value: stats.tasks, icon: CheckSquare, color: 'text-green-500' },
    { label: 'Queries', value: stats.queries, icon: Database, color: 'text-purple-500' },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Stats
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchStats}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="text-center p-3 bg-muted/50 rounded-lg">
              <item.icon className={`h-6 w-6 mx-auto mb-1 ${item.color}`} />
              <p className="text-2xl font-bold">{loading ? '-' : item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
        
        {stats.lastQuery && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Last Query:</p>
            <code className="text-xs bg-muted p-2 rounded block truncate">
              {stats.lastQuery}
            </code>
          </div>
        )}
        
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Last refresh: {lastRefresh.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
