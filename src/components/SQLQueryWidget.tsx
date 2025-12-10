import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Database, Play, AlertCircle } from 'lucide-react';

interface QueryResult {
  data: any[] | null;
  error: string | null;
}

export default function SQLQueryWidget() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: query 
      });
      
      if (error) {
        setResult({ data: null, error: error.message });
      } else {
        setResult({ data, error: null });
      }
    } catch (err: any) {
      setResult({ data: null, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    { label: 'List Tables', query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" },
    { label: 'Count Projects', query: 'SELECT COUNT(*) as count FROM projects' },
    { label: 'Recent Tasks', query: 'SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          SQL Query Console
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
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
          placeholder="Enter SQL query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="font-mono text-sm min-h-[100px]"
        />
        
        <Button 
          onClick={executeQuery} 
          disabled={loading || !query.trim()}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? 'Executing...' : 'Execute Query'}
        </Button>
        
        {result && (
          <div className="mt-4">
            {result.error ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{result.error}</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[300px] border rounded-md">
                <pre className="p-3 text-xs font-mono">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
