import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";

// ── Helpers ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, loading }: { label: string; value: any; loading: boolean }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-2xl font-bold text-white">
      {loading ? <span className="animate-pulse text-slate-600">—</span> : String(value ?? "—")}
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/40">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const DataTable = ({ rows, loading, cols, renderHead, renderRow }: {
  rows: any[]; loading: boolean; cols: string[];
  renderHead: () => React.ReactNode;
  renderRow: (row: any, i: number) => React.ReactNode;
}) => (
  loading ? (
    <div className="flex items-center justify-center h-32 text-slate-500 text-sm animate-pulse">Loading…</div>
  ) : !rows?.length ? (
    <div className="flex items-center justify-center h-20 text-slate-600 text-sm">No data</div>
  ) : (
    <table className="w-full text-sm">
      <thead className="bg-slate-900/50">{renderHead()}</thead>
      <tbody>{rows.map((row, i) => renderRow(row, i))}</tbody>
    </table>
  )
);

// ── Page ───────────────────────────────────────────────────────────────────
const PAGE_ID = "tasks";

const TasksPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const kpiKeys = ["tasks_cc_open_count", "tasks_open_ideas_count"];
      const tableKeys = ["tasks_cc_open", "tasks_cc_critical", "tasks_cc_by_owner", "tasks_open_ideas", "tasks_queue_status"];
      const [kpiResults, tableResults] = await Promise.all([
        Promise.all(kpiKeys.map(k => bridgeQueryKey(PAGE_ID, k))),
        Promise.all(tableKeys.map(k => bridgeQueryKey(PAGE_ID, k))),
      ]);
      const newKpis: Record<string, any> = {};
      kpiKeys.forEach((k, i) => { newKpis[k] = kpiResults[i]?.rows?.[0]?.value ?? kpiResults[i]?.rows?.[0] ?? "—"; });
      const newData: Record<string, any[]> = {};
      tableKeys.forEach((k, i) => { newData[k] = tableResults[i]?.rows ?? []; });
      setKpis(newKpis); setData(newData);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">{PAGE_ID} · live from bridge</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-50">
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Open Tasks" value={kpis["tasks_cc_open_count"]} loading={loading} />
      <StatCard label="Ideas" value={kpis["tasks_open_ideas_count"]} loading={loading} />
      </div>
      {/* Tables */}
      <div className="space-y-4">
      <Section title="Open Tasks">
        <DataTable rows={data["tasks_cc_open"]} loading={loading} cols={["task_ref","title","owner","priority","status","due_date"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">task_ref</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">due_date</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["task_ref"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["priority"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["due_date"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Critical / Overdue">
        <DataTable rows={data["tasks_cc_critical"]} loading={loading} cols={["task_ref","title","owner","due_date"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">task_ref</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">due_date</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["task_ref"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["due_date"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="By Owner">
        <DataTable rows={data["tasks_cc_by_owner"]} loading={loading} cols={["owner","status","cnt"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">cnt</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["cnt"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Open Ideas">
        <DataTable rows={data["tasks_open_ideas"]} loading={loading} cols={["idea_id","category","idea","business_lane","priority","status"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">idea_id</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">idea</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">business_lane</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["idea_id"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["idea"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["business_lane"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["priority"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Queue Status">
        <DataTable rows={data["tasks_queue_status"]} loading={loading} cols={["owner","open","in_progress","done"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">open</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">in_progress</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">done</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["owner"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["open"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["in_progress"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["done"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      </div>
    </div>
  );
};

export default TasksPage;
