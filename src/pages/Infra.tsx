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

const InfraPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await Promise.allSettled([
      bridgeQueryKey("infra_lambda_count").then(rows => setKpis(prev => ({ ...prev, "infra_lambda_count": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "infra_lambda_count": "err" }))),
      bridgeQueryKey("infra_s3_count").then(rows => setKpis(prev => ({ ...prev, "infra_s3_count": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "infra_s3_count": "err" }))),
      bridgeQueryKey("infra_tools_count").then(rows => setKpis(prev => ({ ...prev, "infra_tools_count": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "infra_tools_count": "err" }))),
      bridgeQueryKey("infra_build_total").then(rows => setKpis(prev => ({ ...prev, "infra_build_total": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "infra_build_total": "err" }))),
      bridgeQueryKey("infra_lambda_list").then(rows => setData(prev => ({ ...prev, "infra_lambda_list": rows }))).catch(() => setData(prev => ({ ...prev, "infra_lambda_list": [] }))),
      bridgeQueryKey("infra_lambda_by_category").then(rows => setData(prev => ({ ...prev, "infra_lambda_by_category": rows }))).catch(() => setData(prev => ({ ...prev, "infra_lambda_by_category": [] }))),
      bridgeQueryKey("infra_s3_list").then(rows => setData(prev => ({ ...prev, "infra_s3_list": rows }))).catch(() => setData(prev => ({ ...prev, "infra_s3_list": [] }))),
      bridgeQueryKey("infra_queue_dash").then(rows => setData(prev => ({ ...prev, "infra_queue_dash": rows }))).catch(() => setData(prev => ({ ...prev, "infra_queue_dash": [] }))),
      bridgeQueryKey("infra_tools_list").then(rows => setData(prev => ({ ...prev, "infra_tools_list": rows }))).catch(() => setData(prev => ({ ...prev, "infra_tools_list": [] }))),
      bridgeQueryKey("infra_alerts_list").then(rows => setData(prev => ({ ...prev, "infra_alerts_list": rows }))).catch(() => setData(prev => ({ ...prev, "infra_alerts_list": [] }))),
      ]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Infra</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id: infra · live from bridge · no hardcoded data</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-40">
          {loading ? "↻ Loading…" : "↻ Refresh"}
        </button>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{error}</div>}
      {kpis && Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Lambdas" value={kpis["infra_lambda_count"]} loading={loading} />
      <StatCard label="S3 Buckets" value={kpis["infra_s3_count"]} loading={loading} />
      <StatCard label="Tools" value={kpis["infra_tools_count"]} loading={loading} />
      <StatCard label="Build Actions" value={kpis["infra_build_total"]} loading={loading} />
        </div>
      )}
      <div className="space-y-4">

      <Section title="Lambda Registry" count={(data["infra_lambda_list"] || []).length}>
        <DataTable rows={data["infra_lambda_list"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">function_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">runtime</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">memory_mb</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["function_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["runtime"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["memory_mb"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Lambdas by Category" count={(data["infra_lambda_by_category"] || []).length}>
        <DataTable rows={data["infra_lambda_by_category"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">runtimes</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["count"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["runtimes"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="S3 Buckets" count={(data["infra_s3_list"] || []).length}>
        <DataTable rows={data["infra_s3_list"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">bucket_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">region</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">total_objects</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">primary_use</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["bucket_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["region"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["total_objects"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["primary_use"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Queue Dashboard" count={(data["infra_queue_dash"] || []).length}>
        <DataTable rows={data["infra_queue_dash"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">queue_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">pending</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">processing</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">failed</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">total</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["queue_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["pending"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["processing"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["failed"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["total"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Tools Registry" count={(data["infra_tools_list"] || []).length}>
        <DataTable rows={data["infra_tools_list"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">tool_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">version</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">description</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">is_active</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["tool_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["version"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["description"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["is_active"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Recent Alerts" count={(data["infra_alerts_list"] || []).length}>
        <DataTable rows={data["infra_alerts_list"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">stamp</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">alert_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">severity</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">message</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["stamp"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["alert_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["severity"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["message"] ?? "—")}</td></tr>)}
        />
      </Section>
      </div>
    </div>
  );
};

export default InfraPage;
