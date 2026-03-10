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
const PAGE_ID = "health";

const HealthPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const kpiKeys = [];
      const tableKeys = ["health_pos_health", "health_bridge", "health_system", "health_cron", "health_url", "site_health_defects"];
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
          <h1 className="text-2xl font-bold">Health</h1>
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
      <Section title="Business Health">
        <DataTable rows={data["health_pos_health"]} loading={loading} cols={["business_name","group_code","score_capped","rag","commercial_score","execution_score"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">business_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">group_code</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">score_capped</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">rag</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">commercial_score</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">execution_score</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["business_name"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["group_code"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["score_capped"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["rag"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["commercial_score"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["execution_score"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Bridge Health">
        <DataTable rows={data["health_bridge"]} loading={loading} cols={["service","status","latency_ms","last_check"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">service</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">latency_ms</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">last_check</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["service"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["latency_ms"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["last_check"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="System Health">
        <DataTable rows={data["health_system"]} loading={loading} cols={["service_name","platform","success_rate_pct","total_deploys","last_deploy_at"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">service_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">platform</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">success_rate_pct</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">total_deploys</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">last_deploy_at</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["service_name"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["platform"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["success_rate_pct"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["total_deploys"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["last_deploy_at"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Cron Jobs">
        <DataTable rows={data["health_cron"]} loading={loading} cols={["jobname","schedule","active","last_status","start_time"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">jobname</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">schedule</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">active</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">last_status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">start_time</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["jobname"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["schedule"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["active"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["last_status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["start_time"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="URL Health">
        <DataTable rows={data["health_url"]} loading={loading} cols={["url","status","http_code","response_ms","last_checked_at"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">url</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">http_code</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">response_ms</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">last_checked_at</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["url"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["http_code"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["response_ms"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["last_checked_at"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Site Defects">
        <DataTable rows={data["site_health_defects"]} loading={loading} cols={["biz_key","check_type","check_status","severity","defect_code"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">biz_key</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">check_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">check_status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">severity</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">defect_code</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["biz_key"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["check_type"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["check_status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["severity"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["defect_code"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      </div>
    </div>
  );
};

export default HealthPage;
