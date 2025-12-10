import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DatabaseStatsWidget() {
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    queries: 0,
    lastQuery: null
  });

  const SUPABASE_URL = "https://lzfgigiyqpuuxslsygjt.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projectsResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            query: 'SELECT COUNT(*) as count FROM holowog_projects',
            params: []
          })
        });
        const projectsData = await projectsResp.json();

        const tasksResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            query: 'SELECT COUNT(*) as count FROM run_queue',
            params: []
          })
        });
        const tasksData = await tasksResp.json();

        const queriesResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            query: 'SELECT COUNT(*) as count FROM sql_execution_log',
            params: []
          })
        });
        const queriesData = await queriesResp.json();

        const lastQueryResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            query: 'SELECT query, executed_at FROM sql_execution_log ORDER BY executed_at DESC LIMIT 1',
            params: []
          })
        });
        const lastQueryData = await lastQueryResp.json();

        setStats({
          projects: projectsData[0]?.count || 0,
          tasks: tasksData[0]?.count || 0,
          queries: queriesData[0]?.count || 0,
          lastQuery: lastQueryData[0] || null
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span> Database Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.projects}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.tasks}</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.queries}</div>
            <div className="text-sm text-muted-foreground">Queries</div>
          </div>
        </div>
        
        {stats.lastQuery && (
          <div className="border-t pt-4 mt-4">
            <div className="text-xs text-muted-foreground mb-1">Last Query:</div>
            <div className="text-sm font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded">
              {stats.lastQuery.query.substring(0, 50)}...
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(stats.lastQuery.executed_at).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
