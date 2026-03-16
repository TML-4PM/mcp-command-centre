import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";
const SC = ({ label: l, v, ld }: { label: string; v: any; ld: boolean }) => (<div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4"><div className="text-xs text-slate-500 uppercase tracking-wider mb-1 truncate">{l}</div><div className="text-2xl font-bold text-white font-mono">{ld ? <span className="animate-pulse text-slate-600">—</span> : String(v ?? "—")}</div></div>);
const Sec = ({ title: t, n, children: c }: { title: string; n?: number; children: React.ReactNode }) => (<div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"><div className="px-4 py-3 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-300">{t}</h3>{n !== undefined && <span className="text-xs text-slate-500 font-mono">{n} rows</span>}</div><div className="overflow-x-auto max-h-80">{c}</div></div>);
const DT = ({ rows, ld, head, row }: { rows: any[]; ld: boolean; head: () => React.ReactNode; row: (r: any, i: number) => React.ReactNode }) => (ld ? <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div> : !rows?.length ? <div className="flex items-center justify-center h-16 text-slate-600 text-sm">No data</div> : <table className="w-full text-sm"><thead>{head()}</thead><tbody>{rows.map((r, i) => row(r, i))}</tbody></table>);
const OctoparsePage = () => {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("octoparse_task_registry").then(r => setData(p => ({ ...p, octoparse_task_registry: r }))).catch(() => setData(p => ({ ...p, octoparse_task_registry: [] }))),
        bridgeQueryKey("octoparse_harvest_log").then(r => setData(p => ({ ...p, octoparse_harvest_log: r }))).catch(() => setData(p => ({ ...p, octoparse_harvest_log: [] }))),
        bridgeQueryKey("octoparse_lead_pipeline").then(r => setData(p => ({ ...p, octoparse_lead_pipeline: r }))).catch(() => setData(p => ({ ...p, octoparse_lead_pipeline: [] }))),
        bridgeQueryKey("octoparse_lead_total").then(r => setData(p => ({ ...p, octoparse_lead_total: r }))).catch(() => setData(p => ({ ...p, octoparse_lead_total: [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Octoparse</h1><p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:leads · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      <div className="space-y-4">
        <Sec title="Task Registry" n={(data["octoparse_task_registry"] || []).length}>
          <DT rows={data["octoparse_task_registry"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">task_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">rows_harvested</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">last_run_at</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["task_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["rows_harvested"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["last_run_at"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Harvest Log" n={(data["octoparse_harvest_log"] || []).length}>
          <DT rows={data["octoparse_harvest_log"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">run_at</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">rows_returned</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">rows_loaded</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">destination</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["run_at"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["rows_returned"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["rows_loaded"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["destination"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Lead Pipeline" n={(data["octoparse_lead_pipeline"] || []).length}>
          <DT rows={data["octoparse_lead_pipeline"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">lead_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">biz_key</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">leads</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["lead_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["biz_key"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["leads"] ?? "—")}</td></tr>}
          />
        </Sec>
      </div>
    </div>
  );
};
export default OctoparsePage;
