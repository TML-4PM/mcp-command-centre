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

const GrowthPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("growth_tasks_total").then(r => setKpis(p => ({ ...p, "growth_tasks_total": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "growth_tasks_total": "err" }))),
        bridgeQueryKey("growth_tasks_high").then(r => setKpis(p => ({ ...p, "growth_tasks_high": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "growth_tasks_high": "err" }))),
        bridgeQueryKey("growth_tasks_ongoing").then(r => setKpis(p => ({ ...p, "growth_tasks_ongoing": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "growth_tasks_ongoing": "err" }))),
        bridgeQueryKey("growth_tasks_list").then(r => setData(p => ({ ...p, "growth_tasks_list": r }))).catch(() => setData(p => ({ ...p, "growth_tasks_list": [] }))),
        bridgeQueryKey("growth_tasks_by_cat").then(r => setData(p => ({ ...p, "growth_tasks_by_cat": r }))).catch(() => setData(p => ({ ...p, "growth_tasks_by_cat": [] }))),
        bridgeQueryKey("growth_scorecard_latest").then(r => setData(p => ({ ...p, "growth_scorecard_latest": r }))).catch(() => setData(p => ({ ...p, "growth_scorecard_latest": [] }))),
        bridgeQueryKey("portfolio_growth_console").then(r => setData(p => ({ ...p, "portfolio_growth_console": r }))).catch(() => setData(p => ({ ...p, "portfolio_growth_console": [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Growth</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:growth · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      {Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SC label="Tasks" v={kpis["growth_tasks_total"]} ld={ld} />
          <SC label="High Pri" v={kpis["growth_tasks_high"]} ld={ld} />
          <SC label="Ongoing" v={kpis["growth_tasks_ongoing"]} ld={ld} />
        </div>
      )}
      <div className="space-y-4">
        <Sec title="Tasks" n={(data["growth_tasks_list"] || []).length}>
          <DT rows={data["growth_tasks_list"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">task_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">business_lane</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">priority</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">owner</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["task_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["business_lane"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["priority"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["owner"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="By Category" n={(data["growth_tasks_by_cat"] || []).length}>
          <DT rows={data["growth_tasks_by_cat"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">count</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["count"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Scorecard" n={(data["growth_scorecard_latest"] || []).length}>
          <DT rows={data["growth_scorecard_latest"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">dimension</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">score</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">target</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">gap</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["dimension"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["score"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["target"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["gap"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Portfolio" n={(data["portfolio_growth_console"] || []).length}>
          <DT rows={data["portfolio_growth_console"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">business_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">growth_stage</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">growth_score</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">next_action</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["business_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["growth_stage"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["growth_score"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["next_action"] ?? "—")}</td></tr>}
          />
        </Sec>
      </div>
    </div>
  );
};

export default GrowthPage;