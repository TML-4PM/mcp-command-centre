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

const AgentsPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await Promise.allSettled([
      bridgeQueryKey("agent_ops_activation_candidates").then(rows => setKpis(prev => ({ ...prev, "agent_ops_activation_candidates": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "agent_ops_activation_candidates": "err" }))),
      bridgeQueryKey("agents_schema_total").then(rows => setKpis(prev => ({ ...prev, "agents_schema_total": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "agents_schema_total": "err" }))),
      bridgeQueryKey("act_grid").then(rows => setData(prev => ({ ...prev, "act_grid": rows }))).catch(() => setData(prev => ({ ...prev, "act_grid": [] }))),
      bridgeQueryKey("act_alerts").then(rows => setData(prev => ({ ...prev, "act_alerts": rows }))).catch(() => setData(prev => ({ ...prev, "act_alerts": [] }))),
      bridgeQueryKey("act_work_queue").then(rows => setData(prev => ({ ...prev, "act_work_queue": rows }))).catch(() => setData(prev => ({ ...prev, "act_work_queue": [] }))),
      bridgeQueryKey("agent_ops_registry_breakdown").then(rows => setData(prev => ({ ...prev, "agent_ops_registry_breakdown": rows }))).catch(() => setData(prev => ({ ...prev, "agent_ops_registry_breakdown": [] }))),
      bridgeQueryKey("agents_dossiers").then(rows => setData(prev => ({ ...prev, "agents_dossiers": rows }))).catch(() => setData(prev => ({ ...prev, "agents_dossiers": [] }))),
      bridgeQueryKey("agents_tools").then(rows => setData(prev => ({ ...prev, "agents_tools": rows }))).catch(() => setData(prev => ({ ...prev, "agents_tools": [] }))),
      ]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id: agents · live from bridge · no hardcoded data</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-40">
          {loading ? "↻ Loading…" : "↻ Refresh"}
        </button>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{error}</div>}
      {kpis && Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Activation Candidates" value={kpis["agent_ops_activation_candidates"]} loading={loading} />
      <StatCard label="Schema Tables" value={kpis["agents_schema_total"]} loading={loading} />
        </div>
      )}
      <div className="space-y-4">

      <Section title="Agent Control Tower" count={(data["act_grid"] || []).length}>
        <DataTable rows={data["act_grid"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">agent_id</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">agent_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">health_state</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">last_heartbeat</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">assigned_zone</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["agent_id"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["agent_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["health_state"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["last_heartbeat"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["assigned_zone"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Active Alerts" count={(data["act_alerts"] || []).length}>
        <DataTable rows={data["act_alerts"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">alert_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">severity</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">message</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">created_at</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["alert_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["severity"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["message"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["created_at"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Work Queue" count={(data["act_work_queue"] || []).length}>
        <DataTable rows={data["act_work_queue"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">task_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">assigned_agent</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">enqueued_at</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["task_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["priority"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["assigned_agent"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["enqueued_at"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Registry Breakdown" count={(data["agent_ops_registry_breakdown"] || []).length}>
        <DataTable rows={data["agent_ops_registry_breakdown"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">provenance_source</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">agent_class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">lifecycle_state</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">agent_count</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["provenance_source"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["agent_class"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["lifecycle_state"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["agent_count"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Agent Dossiers" count={(data["agents_dossiers"] || []).length}>
        <DataTable rows={data["agents_dossiers"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">agent_code</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">display_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">family_primary</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">assigned_zone</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["agent_code"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["display_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["family_primary"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["assigned_zone"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Active Tools" count={(data["agents_tools"] || []).length}>
        <DataTable rows={data["agents_tools"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">tool_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">description</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">cost_hint</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["tool_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["description"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["cost_hint"] ?? "—")}</td></tr>)}
        />
      </Section>
      </div>
    </div>
  );
};

export default AgentsPage;
