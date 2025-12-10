import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SQLQueryWidget() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const SUPABASE_URL = "https://lzfgigiyqpuuxslsygjt.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q";

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, params: [] })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Query failed');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    { label: 'Active Projects', query: 'SELECT * FROM holowog_projects WHERE status = \'active\'' },
    { label: 'Recent Tasks', query: 'SELECT * FROM run_queue ORDER BY created_at DESC LIMIT 10' },
    { label: 'Project Count', query: 'SELECT COUNT(*) FROM holowog_projects' },
    { label: 'Recent SQL Logs', query: 'SELECT * FROM sql_execution_log ORDER BY executed_at DESC LIMIT 10' }
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🔍</span> SQL Query Console
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {quickQueries.map((q) => (
            <Button
              key={q.label}
              variant="outline"
              size="sm"
              onClick={() => setQuery(q.query)}
            >
              {q.label}
            </Button>
          ))}
        </div>

        <Textarea
          placeholder="Enter SQL query (SELECT, INSERT, UPDATE, DELETE only)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />

        <Button 
          onClick={executeQuery} 
          disabled={loading || !query}
          className="w-full"
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
            <div className="text-sm font-medium mb-2">
              Results ({Array.isArray(results) ? results.length : 0} rows)
            </div>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
