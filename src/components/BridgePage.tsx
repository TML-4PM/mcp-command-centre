import { useEffect, useState } from "react";
import { bridgeSQL, bridgeCount, bridgeQueryKey } from "@/lib/bridge";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BridgePageProps {
  pageId: string;
  title: string;
  icon?: string;
}

interface QueryDef { key: string; return_type: string; d: string; }

const BridgePage = ({ pageId, title, icon }: BridgePageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queries, setQueries] = useState<QueryDef[]>([]);
  const [data, setData] = useState<Record<string, any>>({});

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all queries for this page
      const qResult = await bridgeSQL(
        `SELECT key, return_type, LEFT(description,80) as d FROM command_centre_queries WHERE page_id = '${pageId}' AND is_active = true ORDER BY key`
      );
      const qs: QueryDef[] = qResult.rows;
      setQueries(qs);

      // Execute each query in parallel
      const results = await Promise.allSettled(
        qs.map(q => bridgeQueryKey(q.key))
      );

      const newData: Record<string, any> = {};
      qs.forEach((q, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          newData[q.key] = { rows: r.value, type: q.return_type };
        } else {
          newData[q.key] = { rows: [], type: q.return_type, error: (r.reason as Error)?.message };
        }
      });
      setData(newData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(); }, [pageId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-3" />
      <span className="text-slate-400">Loading {title}...</span>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 space-y-4">
      <div className="text-red-400">⚠ Failed to load {title}</div>
      <div className="text-slate-500 text-sm">{error}</div>
      <button onClick={fetchPage} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"><RefreshCw className="w-4 h-4 inline mr-2" />Retry</button>
    </div>
  );

  // Separate value queries (stat cards) from row queries (tables)
  const valueQueries = queries.filter(q => q.return_type === 'value');
  const rowQueries = queries.filter(q => q.return_type === 'rows');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{icon} {title}</h1>
        <button onClick={fetchPage} className="text-slate-400 hover:text-white transition"><RefreshCw className="w-5 h-5" /></button>
      </div>

      {/* Stat Cards Row */}
      {valueQueries.length > 0 && (
        <div className={`grid gap-4 ${valueQueries.length <= 3 ? 'grid-cols-3' : valueQueries.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
          {valueQueries.map(q => {
            const d = data[q.key];
            const val = d?.rows?.[0] ? Object.values(d.rows[0])[0] : 0;
            return (
              <Card key={q.key} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-sm text-slate-400 mb-1">{q.d || q.key.replace(/_/g, ' ')}</div>
                  <div className="text-3xl font-bold text-blue-400">{typeof val === 'number' ? val.toLocaleString() : String(val)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Data Tables */}
      {rowQueries.map(q => {
        const d = data[q.key];
        const rows = d?.rows || [];
        if (!rows.length) return null;
        const cols = Object.keys(rows[0]);
        return (
          <Card key={q.key} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">{q.d || q.key.replace(/_/g, ' ')}</CardTitle>
              <div className="text-xs text-slate-500">{rows.length} rows</div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {cols.map(c => <th key={c} className="text-left p-2 text-slate-400 font-medium">{c.replace(/_/g, ' ')}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-700/30">
                        {cols.map(c => <td key={c} className="p-2 text-slate-300">{row[c] != null ? String(row[c]) : '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {queries.length === 0 && (
        <div className="text-center py-12 text-slate-500">No queries registered for this page. Add them to command_centre_queries with page_id = '{pageId}'.</div>
      )}
    </div>
  );
};

export default BridgePage;
