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

const IPPortfolioPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await Promise.allSettled([
      bridgeQueryKey("ip_total").then(rows => setKpis(prev => ({ ...prev, "ip_total": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "ip_total": "err" }))),
      bridgeQueryKey("ip_families_count").then(rows => setKpis(prev => ({ ...prev, "ip_families_count": rows[0]?.value ?? rows[0] ?? "—" }))).catch(() => setKpis(prev => ({ ...prev, "ip_families_count": "err" }))),
      bridgeQueryKey("ip_canonical").then(rows => setData(prev => ({ ...prev, "ip_canonical": rows }))).catch(() => setData(prev => ({ ...prev, "ip_canonical": [] }))),
      bridgeQueryKey("ip_families").then(rows => setData(prev => ({ ...prev, "ip_families": rows }))).catch(() => setData(prev => ({ ...prev, "ip_families": [] }))),
      bridgeQueryKey("ip_by_class").then(rows => setData(prev => ({ ...prev, "ip_by_class": rows }))).catch(() => setData(prev => ({ ...prev, "ip_by_class": [] }))),
      bridgeQueryKey("ip_filing_spend").then(rows => setData(prev => ({ ...prev, "ip_filing_spend": rows }))).catch(() => setData(prev => ({ ...prev, "ip_filing_spend": [] }))),
      bridgeQueryKey("product_defensibility").then(rows => setData(prev => ({ ...prev, "product_defensibility": rows }))).catch(() => setData(prev => ({ ...prev, "product_defensibility": [] }))),
      ]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">IP Portfolio</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id: ip · live from bridge · no hardcoded data</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-40">
          {loading ? "↻ Loading…" : "↻ Refresh"}
        </button>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{error}</div>}
      {kpis && Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Total IP Assets" value={kpis["ip_total"]} loading={loading} />
      <StatCard label="Families" value={kpis["ip_families_count"]} loading={loading} />
        </div>
      )}
      <div className="space-y-4">

      <Section title="IP Register" count={(data["ip_canonical"] || []).length}>
        <DataTable rows={data["ip_canonical"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">family</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">filing_date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["asset_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["family"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["asset_class"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["filing_date"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["priority"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Family Rollup" count={(data["ip_families"] || []).length}>
        <DataTable rows={data["ip_families"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">family</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">value_driver</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["family"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["asset_count"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["priority"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["value_driver"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="By Asset Class" count={(data["ip_by_class"] || []).length}>
        <DataTable rows={data["ip_by_class"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">cnt</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["asset_class"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["cnt"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Filing Spend" count={(data["ip_filing_spend"] || []).length}>
        <DataTable rows={data["ip_filing_spend"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">filing_date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">amount_aud</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">vendor</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["asset_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["filing_date"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["amount_aud"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["vendor"] ?? "—")}</td></tr>)}
        />
      </Section>
      <Section title="Product Defensibility" count={(data["product_defensibility"] || []).length}>
        <DataTable rows={data["product_defensibility"]} loading={loading}
          renderHead={()=>(<tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">product_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">assets_real</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">real_coverage_pct</th></tr>)}
          renderRow={(row, i)=>(<tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["product_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["assets_real"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-[180px] truncate">{String(row["real_coverage_pct"] ?? "—")}</td></tr>)}
        />
      </Section>
      </div>
    </div>
  );
};

export default IPPortfolioPage;
