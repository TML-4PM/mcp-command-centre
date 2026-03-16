import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";
const Sec = ({ title: t, n, children: c }: { title: string; n?: number; children: React.ReactNode }) => (<div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"><div className="px-4 py-3 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-300">{t}</h3>{n !== undefined && <span className="text-xs text-slate-500 font-mono">{n} rows</span>}</div><div className="overflow-x-auto max-h-80">{c}</div></div>);
const DT = ({ rows, ld, head, row }: { rows: any[]; ld: boolean; head: () => React.ReactNode; row: (r: any, i: number) => React.ReactNode }) => (ld ? <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div> : !rows?.length ? <div className="flex items-center justify-center h-16 text-slate-600 text-sm">No data</div> : <table className="w-full text-sm"><thead>{head()}</thead><tbody>{rows.map((r, i) => row(r, i))}</tbody></table>);
const AppConsolePage = () => {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("app_console_list").then(r => setData(p => ({ ...p, app_console_list: r }))).catch(() => setData(p => ({ ...p, app_console_list: [] }))),
        bridgeQueryKey("app_console_status").then(r => setData(p => ({ ...p, app_console_status: r }))).catch(() => setData(p => ({ ...p, app_console_status: [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">App Console</h1><p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:apps · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      {!ld && !err && Object.values(data).every(v => !v.length) && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-500 text-sm">
          No app console queries registered for page_id:apps — add keys to command_centre_queries
        </div>
      )}
      <div className="space-y-4">
        {(data["app_console_list"] || []).length > 0 && (
          <Sec title="Apps" n={(data["app_console_list"] || []).length}>
            <DT rows={data["app_console_list"]} ld={ld}
              head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">url</th></tr>}
              row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["url"] ?? "—")}</td></tr>}
            />
          </Sec>
        )}
      </div>
    </div>
  );
};
export default AppConsolePage;
