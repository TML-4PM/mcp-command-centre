import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Loader2, RefreshCw, Download, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface BridgePageProps { pageId: string; title: string; icon?: string; }
interface QueryDef { key: string; return_type: string; d: string; }

const fmt = (val: any, col: string): string => {
  if (val == null) return "—";
  if (typeof val === "boolean") return val ? "✅" : "❌";
  const s = String(val);
  const lc = col.toLowerCase();
  if (lc.includes("amount") || lc.includes("spend") || lc.includes("revenue") || lc.includes("cost") || lc.includes("balance") || lc.includes("rebate") || lc.includes("refund") || lc.includes("price")) {
    const n = Number(val);
    if (!isNaN(n)) return n < 0 ? `-$${Math.abs(n).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : `$${n.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  }
  if ((lc.includes("percent") || lc.includes("rate") || lc.includes("coverage")) && typeof val === "number" && val <= 1) {
    return `${(val * 100).toFixed(1)}%`;
  }
  if (lc.includes("_at") || lc.includes("date") || lc.includes("created") || lc.includes("updated")) {
    try { return new Date(s).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }); } catch { return s; }
  }
  if (s.length > 80) return s.slice(0, 77) + "…";
  return s;
};

const statusColor = (val: any): string => {
  const s = String(val).toLowerCase();
  if (["active","healthy","live","complete","approved","core","real"].includes(s)) return "text-green-400";
  if (["warning","pending","draft","growth","trial","planned"].includes(s)) return "text-amber-400";
  if (["error","failed","dead","inactive","missing","pretend"].includes(s)) return "text-red-400";
  return "";
};

const BridgePage = ({ pageId, title, icon }: BridgePageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queries, setQueries] = useState<QueryDef[]>([]);
  const [data, setData] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qResult = await bridgeSQL(
        `SELECT key, return_type, LEFT(description,80) as d FROM command_centre_queries WHERE page_id = '${pageId}' AND is_active = true ORDER BY key`
      );
      const qs: QueryDef[] = qResult.rows;
      setQueries(qs);

      // Get actual SQL for each key and execute
      const sqlLookup = await bridgeSQL(
        `SELECT key, sql FROM command_centre_queries WHERE page_id = '${pageId}' AND is_active = true`
      );
      const sqlMap: Record<string, string> = {};
      sqlLookup.rows.forEach((r: any) => { sqlMap[r.key] = r.sql; });

      const results = await Promise.allSettled(
        qs.map(q => bridgeSQL(sqlMap[q.key] || `SELECT 'missing query' as error`))
      );

      const newData: Record<string, any> = {};
      qs.forEach((q, i) => {
        const r = results[i];
        if (r.status === "fulfilled") {
          newData[q.key] = { rows: r.value.rows, count: r.value.count, type: q.return_type };
        } else {
          newData[q.key] = { rows: [], count: 0, type: q.return_type, error: (r.reason as Error)?.message };
        }
      });
      setData(newData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const exportCSV = (key: string, rows: any[]) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(","), ...rows.map(r => cols.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${key}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-3" />
      <span className="text-slate-400">Loading {title}...</span>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 space-y-4">
      <div className="text-red-400 text-xl">⚠ {title}</div>
      <div className="text-slate-500 text-sm">{error}</div>
      <button onClick={fetchPage} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />Retry
      </button>
    </div>
  );

  const valueQueries = queries.filter(q => q.return_type === "value");
  const rowQueries = queries.filter(q => q.return_type === "rows");
  const errorQueries = queries.filter(q => data[q.key]?.error);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{icon} {title}</h1>
        <div className="flex items-center gap-3">
          {rowQueries.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input placeholder="Filter tables..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 w-48 bg-slate-800 border-slate-700 text-sm" />
            </div>
          )}
          <button onClick={fetchPage} className="text-slate-400 hover:text-white transition p-2 rounded hover:bg-slate-800">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error summary */}
      {errorQueries.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-400 font-medium mb-2">⚠ {errorQueries.length} query error{errorQueries.length > 1 ? "s" : ""}</div>
          {errorQueries.map(q => (
            <div key={q.key} className="text-xs text-red-300/70 font-mono">{q.key}: {data[q.key]?.error}</div>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      {valueQueries.length > 0 && (
        <div className={`grid gap-4 ${valueQueries.length <= 3 ? "grid-cols-3" : valueQueries.length <= 5 ? "grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
          {valueQueries.map(q => {
            const d = data[q.key];
            const first = d?.rows?.[0];
            const val = first ? Object.values(first)[0] : 0;
            const hasError = !!d?.error;
            return (
              <Card key={q.key} className={`border-slate-700 ${hasError ? "bg-red-900/20 border-red-500/30" : "bg-slate-800/50"}`}>
                <CardContent className="p-5">
                  <div className="text-sm text-slate-400 mb-1">{q.d || q.key.replace(/_/g, " ")}</div>
                  <div className={`text-3xl font-bold ${hasError ? "text-red-400" : "text-blue-400"}`}>
                    {hasError ? "ERR" : typeof val === "number" ? val.toLocaleString() : String(val)}
                  </div>
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
        const hasError = !!d?.error;
        const label = q.d || q.key.replace(/_/g, " ");
        if (search && !label.toLowerCase().includes(search.toLowerCase()) && !q.key.includes(search.toLowerCase())) return null;
        const isCollapsed = collapsed[q.key];

        if (hasError) return (
          <Card key={q.key} className="bg-red-900/20 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-400">{label}</CardTitle>
              <div className="text-xs text-red-300/70 font-mono">{d.error}</div>
            </CardHeader>
          </Card>
        );

        const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
        const statusCols = cols.filter(c => ["status","state","health","portfolio_class","reality","stage"].includes(c.toLowerCase()));

        return (
          <Card key={q.key} className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCollapsed(p => ({...p, [q.key]: !p[q.key]}))}>
                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{rows.length} rows</span>
                </div>
                {rows.length > 0 && (
                  <button onClick={() => exportCSV(q.key, rows)} className="text-slate-500 hover:text-white transition p-1" title="Export CSV">
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent>
                {rows.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No data — table exists but is empty</div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-800">
                        <tr className="border-b border-slate-700">
                          {cols.map(c => (
                            <th key={c} className="text-left p-2 text-slate-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                              {c.replace(/_/g, " ")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 100).map((row: any, i: number) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-700/20">
                            {cols.map(c => (
                              <td key={c} className={`p-2 text-slate-300 ${statusCols.includes(c) ? statusColor(row[c]) : ""}`}>
                                {fmt(row[c], c)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 100 && (
                      <div className="text-center py-2 text-xs text-slate-500">Showing 100 of {rows.length} rows</div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {queries.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <div className="text-slate-500 text-lg mb-2">No queries registered</div>
            <div className="text-slate-600 text-sm font-mono">INSERT INTO command_centre_queries (key, page_id, sql, return_type, description) VALUES ('...', '{pageId}', '...', 'rows', '...');</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BridgePage;
