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
const PAGE_ID = "grants";

const GrantsPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const kpiKeys = ["grants_count", "grants_total_value"];
      const tableKeys = ["grants_opportunities", "grants_pipeline", "grants_deadlines", "grants_budget", "grants_completeness"];
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
          <h1 className="text-2xl font-bold">Grants</h1>
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
      <StatCard label="Active Grants" value={kpis["grants_count"]} loading={loading} />
      <StatCard label="Total Value" value={kpis["grants_total_value"]} loading={loading} />
      </div>
      {/* Tables */}
      <div className="space-y-4">
      <Section title="Opportunities">
        <DataTable rows={data["grants_opportunities"]} loading={loading} cols={["title","agency","status","jurisdiction","fit_score","amount_aud","deadline"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">agency</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">jurisdiction</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">fit_score</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">amount_aud</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">deadline</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["agency"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["jurisdiction"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["fit_score"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["amount_aud"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["deadline"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Pipeline by Stage">
        <DataTable rows={data["grants_pipeline"]} loading={loading} cols={["stage","grant_count","total_value"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">stage</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">grant_count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">total_value</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["stage"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["grant_count"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["total_value"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Deadlines — 60d">
        <DataTable rows={data["grants_deadlines"]} loading={loading} cols={["title","deadline","agency","amount_aud","status"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">title</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">deadline</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">agency</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">amount_aud</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["title"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["deadline"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["agency"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["amount_aud"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Budget vs Actual">
        <DataTable rows={data["grants_budget"]} loading={loading} cols={["grant_name","budget","actual","variance"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">grant_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">budget</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">actual</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">variance</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["grant_name"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["budget"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["actual"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["variance"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Submission Completeness">
        <DataTable rows={data["grants_completeness"]} loading={loading} cols={["grant_name","completeness_pct","missing_items"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">grant_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">completeness_pct</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">missing_items</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["grant_name"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["completeness_pct"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["missing_items"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      </div>
    </div>
  );
};

export default GrantsPage;
