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

const SitesPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("customers_sites_count").then(r => setKpis(p => ({ ...p, "customers_sites_count": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "customers_sites_count": "err" }))),
        bridgeQueryKey("customers_site_status").then(r => setData(p => ({ ...p, "customers_site_status": r }))).catch(() => setData(p => ({ ...p, "customers_site_status": [] }))),
        bridgeQueryKey("customers_sites").then(r => setData(p => ({ ...p, "customers_sites": r }))).catch(() => setData(p => ({ ...p, "customers_sites": [] }))),
        bridgeQueryKey("customers_vercel").then(r => setData(p => ({ ...p, "customers_vercel": r }))).catch(() => setData(p => ({ ...p, "customers_vercel": [] }))),
        bridgeQueryKey("customers_domains").then(r => setData(p => ({ ...p, "customers_domains": r }))).catch(() => setData(p => ({ ...p, "customers_domains": [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Sites</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:customers · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      {Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SC label="Sites" v={kpis["customers_sites_count"]} ld={ld} />
        </div>
      )}
      <div className="space-y-4">
        <Sec title="By Status" n={(data["customers_site_status"] || []).length}>
          <DT rows={data["customers_site_status"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">cnt</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["cnt"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Registry" n={(data["customers_sites"] || []).length}>
          <DT rows={data["customers_sites"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">site_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">primary_url</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">lifecycle_stage</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">operational_function</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">zone</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["site_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["primary_url"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["lifecycle_stage"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["operational_function"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["zone"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Vercel" n={(data["customers_vercel"] || []).length}>
          <DT rows={data["customers_vercel"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">project_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">group_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">vercel_url</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["project_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["group_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["vercel_url"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Domains" n={(data["customers_domains"] || []).length}>
          <DT rows={data["customers_domains"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">slug</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">display_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">primary_url</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">http_code</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["slug"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["display_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["primary_url"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["http_code"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td></tr>}
          />
        </Sec>
      </div>
    </div>
  );
};

export default SitesPage;