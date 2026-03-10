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
const PAGE_ID = "jobs";

const JobsPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const kpiKeys = [];
      const tableKeys = ["jobs_tier1_board", "jobs_pipeline", "jobs_myjet_queue", "jobs_myjet_health", "jobs_skills", "jobs_stuck"];
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
          <h1 className="text-2xl font-bold">Jobs</h1>
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
      </div>
      {/* Tables */}
      <div className="space-y-4">
      <Section title="Tier 1 Job Board">
        <DataTable rows={data["jobs_tier1_board"]} loading={loading} cols={["company","job_title","location","status","salary_min","salary_max","fit_score","applied_date"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">company</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">job_title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">location</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">salary_min</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">salary_max</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">fit_score</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">applied_date</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["company"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["job_title"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["location"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["salary_min"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["salary_max"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["fit_score"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["applied_date"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Pipeline Status">
        <DataTable rows={data["jobs_pipeline"]} loading={loading} cols={["stage","count","last_updated"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">stage</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">last_updated</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["stage"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["count"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["last_updated"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="JET Queue">
        <DataTable rows={data["jobs_myjet_queue"]} loading={loading} cols={["job_id","company","title","status","fit_score","queued_at"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">job_id</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">company</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">fit_score</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">queued_at</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["job_id"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["company"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["fit_score"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["queued_at"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="JET Health">
        <DataTable rows={data["jobs_myjet_health"]} loading={loading} cols={["metric","value","status"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">metric</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">value</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["metric"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["value"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Skill Trends 30d">
        <DataTable rows={data["jobs_skills"]} loading={loading} cols={["skill","demand_count","trend","growth_pct"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">skill</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">demand_count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">trend</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">growth_pct</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["skill"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["demand_count"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["trend"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["growth_pct"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Stuck Jobs">
        <DataTable rows={data["jobs_stuck"]} loading={loading} cols={["job_id","company","title","status","days_stuck","blocker"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">job_id</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">company</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">days_stuck</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">blocker</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["job_id"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["company"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["days_stuck"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["blocker"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      </div>
    </div>
  );
};

export default JobsPage;
