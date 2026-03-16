import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";

const SC = ({ label: l, v, ld }: { label: string; v: any; ld: boolean }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 truncate">{l}</div>
    <div className="text-2xl font-bold text-white font-mono">{ld ? <span className="animate-pulse text-slate-600">—</span> : String(v ?? "—")}</div>
  </div>
);

const Sec = ({ title: t, n, children: c }: { title: string; n?: number; children: React.ReactNode }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-300">{t}</h3>
      {n !== undefined && <span className="text-xs text-slate-500 font-mono">{n} rows</span>}
    </div>
    <div className="overflow-x-auto max-h-80">{c}</div>
  </div>
);

const DT = ({ rows, ld, head, row }: { rows: any[]; ld: boolean; head: () => React.ReactNode; row: (r: any, i: number) => React.ReactNode }) => (
  ld ? <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div>
  : !rows?.length ? <div className="flex items-center justify-center h-16 text-slate-600 text-sm">No data</div>
  : <table className="w-full text-sm"><thead>{head()}</thead><tbody>{rows.map((r, i) => row(r, i))}</tbody></table>
);

const IPPortfolioPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("ip_total").then(r => setKpis(p => ({ ...p, "ip_total": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "ip_total": "err" }))),
        bridgeQueryKey("ip_families_count").then(r => setKpis(p => ({ ...p, "ip_families_count": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "ip_families_count": "err" }))),
        bridgeQueryKey("ip_canonical").then(r => setData(p => ({ ...p, "ip_canonical": r }))).catch(() => setData(p => ({ ...p, "ip_canonical": [] }))),
        bridgeQueryKey("ip_families").then(r => setData(p => ({ ...p, "ip_families": r }))).catch(() => setData(p => ({ ...p, "ip_families": [] }))),
        bridgeQueryKey("ip_by_class").then(r => setData(p => ({ ...p, "ip_by_class": r }))).catch(() => setData(p => ({ ...p, "ip_by_class": [] }))),
        bridgeQueryKey("ip_filing_spend").then(r => setData(p => ({ ...p, "ip_filing_spend": r }))).catch(() => setData(p => ({ ...p, "ip_filing_spend": [] }))),
        bridgeQueryKey("product_defensibility").then(r => setData(p => ({ ...p, "product_defensibility": r }))).catch(() => setData(p => ({ ...p, "product_defensibility": [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">IP Portfolio</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:ip · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      {Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SC label="Assets" v={kpis["ip_total"]} ld={ld} />
          <SC label="Families" v={kpis["ip_families_count"]} ld={ld} />
        </div>
      )}
      <div className="space-y-4">
        <Sec title="IP Register" n={(data["ip_canonical"] || []).length}>
          <DT rows={data["ip_canonical"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">family</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">filing_date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["asset_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["family"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["asset_class"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["filing_date"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["priority"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Families" n={(data["ip_families"] || []).length}>
          <DT rows={data["ip_families"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">family</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">value_driver</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["family"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["asset_count"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["priority"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["value_driver"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="By Class" n={(data["ip_by_class"] || []).length}>
          <DT rows={data["ip_by_class"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">cnt</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["asset_class"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["cnt"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Filing Spend" n={(data["ip_filing_spend"] || []).length}>
          <DT rows={data["ip_filing_spend"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">asset_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">filing_date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">amount_aud</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">vendor</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["asset_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["filing_date"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["amount_aud"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["vendor"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Defensibility" n={(data["product_defensibility"] || []).length}>
          <DT rows={data["product_defensibility"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">product_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">assets_real</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">real_coverage_pct</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["product_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["assets_real"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["real_coverage_pct"] ?? "—")}</td></tr>}
          />
        </Sec>
      </div>
    </div>
  );
};

export default IPPortfolioPage;