import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";

const StatCard = ({ label, value, loading }: { label: string; value: any; loading: boolean }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 min-w-0">
    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 truncate">{label}</div>
    <div className="text-2xl font-bold text-white font-mono">
      {loading ? <span className="animate-pulse text-slate-600">—</span> : String(value ?? "—")}
    </div>
  </div>
);

const Section = ({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      {count !== undefined && <span className="text-xs text-slate-500 font-mono">{count} rows</span>}
    </div>
    <div className="overflow-x-auto max-h-80">{children}</div>
  </div>
);

const DataTable = ({ rows, loading, renderHead, renderRow }: {
  rows: any[]; loading: boolean;
  renderHead: () => React.ReactNode;
  renderRow: (row: any, i: number) => React.ReactNode;
}) => (
  loading ? (
    <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div>
  ) : !rows?.length ? (
    <div className="flex items-center justify-center h-16 text-slate-600 text-sm">No data</div>
  ) : (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">{renderHead()}</thead>
      <tbody>{rows.map((row, i) => renderRow(row, i))}</tbody>
    </table>
  )
);

const MCPPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await Promise.allSettled([
      bridgeQueryKey("mcp_tools_total").then(rows => setKpis(prev => ({ ...prev, "mcp_tools_total": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "mcp_tools_total": "err" }))),
      bridgeQueryKey("mcp_tools_production").then(rows => setKpis(prev => ({ ...prev, "mcp_tools_production": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "mcp_tools_production": "err" }))),
      bridgeQueryKey("mcp_actions_total").then(rows => setKpis(prev => ({ ...prev, "mcp_actions_total": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "mcp_actions_total": "err" }))),
      bridgeQueryKey("mcp_doc_waves_total").then(rows => setKpis(prev => ({ ...prev, "mcp_doc_waves_total": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "mcp_doc_waves_total": "err" }))),
      bridgeQueryKey("mcp_tools_list").then(rows => setData(prev => ({ ...prev, "mcp_tools_list": rows }))).catch(() => setData(prev => ({ ...prev, "mcp_tools_list": [] }))),
      bridgeQueryKey("mcp_actions_list").then(rows => setData(prev => ({ ...prev, "mcp_actions_list": rows }))).catch(() => setData(prev => ({ ...prev, "mcp_actions_list": [] }))),
      bridgeQueryKey("mcp_shared_services").then(rows => setData(prev => ({ ...prev, "mcp_shared_services": rows }))).catch(() => setData(prev => ({ ...prev, "mcp_shared_services": [] }))),
      bridgeQueryKey("mcp_doc_waves_list").then(rows => setData(prev => ({ ...prev, "mcp_doc_waves_list": rows }))).catch(() => setData(prev => ({ ...prev, "mcp_doc_waves_list": [] }))),
      ]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">MCP</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id: mcp · live from bridge · no hardcoded data</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-40">
          {loading ? "↻ Loading…" : "↻ Refresh"}
        </button>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{error}</div>}
      {kpis && Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Total Tools" value={kpis["mcp_tools_total"]} loading={loading} />
      <StatCard label="Production" value={kpis["mcp_tools_production"]} loading={loading} />
      <StatCard label="Actions" value={kpis["mcp_actions_total"]} loading={loading} />
      <StatCard label="Doc Waves" value={kpis["mcp_doc_waves_total"]} loading={loading} />
        </div>
      )}
      <div className="space-y-4">

      <Section title="Tools Catalog" count={(data["mcp_tools_list"] || []).length}>
        <DataTable rows={data["mcp_tools_list"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">tool_id</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">description</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">language</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["tool_id"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["description"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["language"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="OpenClaw Actions" count={(data["mcp_actions_list"] || []).length}>
        <DataTable rows={data["mcp_actions_list"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">action_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">ai_model</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["action_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["ai_model"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Shared Services" count={(data["mcp_shared_services"] || []).length}>
        <DataTable rows={data["mcp_shared_services"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">service_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">tier</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">sla_uptime</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["service_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["tier"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["sla_uptime"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Document Waves" count={(data["mcp_doc_waves_list"] || []).length}>
        <DataTable rows={data["mcp_doc_waves_list"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">wave</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">topic</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">evidence_class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["wave"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["topic"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["evidence_class"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      </div>
    </div>
  );
};

export default MCPPage;
