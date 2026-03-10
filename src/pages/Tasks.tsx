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

const TasksPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await Promise.allSettled([
      bridgeQueryKey("tasks_cc_open_count").then(rows => setKpis(prev => ({ ...prev, "tasks_cc_open_count": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "tasks_cc_open_count": "err" }))),
      bridgeQueryKey("tasks_open_ideas_count").then(rows => setKpis(prev => ({ ...prev, "tasks_open_ideas_count": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "tasks_open_ideas_count": "err" }))),
      bridgeQueryKey("tasks_cc_open").then(rows => setData(prev => ({ ...prev, "tasks_cc_open": rows }))).catch(() => setData(prev => ({ ...prev, "tasks_cc_open": [] }))),
      bridgeQueryKey("tasks_cc_critical").then(rows => setData(prev => ({ ...prev, "tasks_cc_critical": rows }))).catch(() => setData(prev => ({ ...prev, "tasks_cc_critical": [] }))),
      bridgeQueryKey("tasks_cc_by_owner").then(rows => setData(prev => ({ ...prev, "tasks_cc_by_owner": rows }))).catch(() => setData(prev => ({ ...prev, "tasks_cc_by_owner": [] }))),
      bridgeQueryKey("tasks_open_ideas").then(rows => setData(prev => ({ ...prev, "tasks_open_ideas": rows }))).catch(() => setData(prev => ({ ...prev, "tasks_open_ideas": [] }))),
      bridgeQueryKey("tasks_queue_status").then(rows => setData(prev => ({ ...prev, "tasks_queue_status": rows }))).catch(() => setData(prev => ({ ...prev, "tasks_queue_status": [] }))),
      ]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id: tasks · live from bridge · no hardcoded data</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-40">
          {loading ? "↻ Loading…" : "↻ Refresh"}
        </button>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{error}</div>}
      {kpis && Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Open Tasks" value={kpis["tasks_cc_open_count"]} loading={loading} />
      <StatCard label="Ideas (PRETEND)" value={kpis["tasks_open_ideas_count"]} loading={loading} />
        </div>
      )}
      <div className="space-y-4">

      <Section title="Open Tasks" count={(data["tasks_cc_open"] || []).length}>
        <DataTable rows={data["tasks_cc_open"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">task_ref</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">due_date</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["task_ref"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["priority"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["due_date"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Critical / Overdue" count={(data["tasks_cc_critical"] || []).length}>
        <DataTable rows={data["tasks_cc_critical"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">task_ref</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">due_date</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["task_ref"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["due_date"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="By Owner" count={(data["tasks_cc_by_owner"] || []).length}>
        <DataTable rows={data["tasks_cc_by_owner"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">cnt</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["cnt"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Open Ideas" count={(data["tasks_open_ideas"] || []).length}>
        <DataTable rows={data["tasks_open_ideas"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">idea</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">business_lane</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["idea"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["business_lane"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["priority"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Queue by Owner" count={(data["tasks_queue_status"] || []).length}>
        <DataTable rows={data["tasks_queue_status"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">open</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">in_progress</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">done</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["open"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["in_progress"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["done"] ?? "—")}</td></tr>)}
        />
      </Section>
      </div>
    </div>
  );
};

export default TasksPage;
