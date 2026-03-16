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

const AnalyticsPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("analytics_total").then(r => setKpis(p => ({ ...p, "analytics_total": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "analytics_total": "err" }))),
        bridgeQueryKey("analytics_by_type").then(r => setData(p => ({ ...p, "analytics_by_type": r }))).catch(() => setData(p => ({ ...p, "analytics_by_type": [] }))),
        bridgeQueryKey("analytics_daily").then(r => setData(p => ({ ...p, "analytics_daily": r }))).catch(() => setData(p => ({ ...p, "analytics_daily": [] }))),
        bridgeQueryKey("analytics_recent").then(r => setData(p => ({ ...p, "analytics_recent": r }))).catch(() => setData(p => ({ ...p, "analytics_recent": [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:analytics · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      {Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SC label="Events" v={kpis["analytics_total"]} ld={ld} />
        </div>
      )}
      <div className="space-y-4">
        <Sec title="By Type" n={(data["analytics_by_type"] || []).length}>
          <DT rows={data["analytics_by_type"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">event_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">cnt</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["event_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["cnt"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Daily" n={(data["analytics_daily"] || []).length}>
          <DT rows={data["analytics_daily"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">day</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">cnt</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["day"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["cnt"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Recent" n={(data["analytics_recent"] || []).length}>
          <DT rows={data["analytics_recent"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">event_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">user_id</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">page_url</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">created_at</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["event_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["user_id"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["page_url"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["created_at"] ?? "—")}</td></tr>}
          />
        </Sec>
      </div>
    </div>
  );
};

export default AnalyticsPage;