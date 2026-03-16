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

const ToolsPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("tools_total").then(r => setKpis(p => ({ ...p, "tools_total": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "tools_total": "err" }))),
        bridgeQueryKey("tools_runs").then(r => setKpis(p => ({ ...p, "tools_runs": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "tools_runs": "err" }))),
        bridgeQueryKey("tools_sessions").then(r => setKpis(p => ({ ...p, "tools_sessions": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "tools_sessions": "err" }))),
        bridgeQueryKey("tools_sensors").then(r => setKpis(p => ({ ...p, "tools_sensors": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "tools_sensors": "err" }))),
        bridgeQueryKey("tools_variants").then(r => setKpis(p => ({ ...p, "tools_variants": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "tools_variants": "err" }))),
        bridgeQueryKey("tools_registry").then(r => setData(p => ({ ...p, "tools_registry": r }))).catch(() => setData(p => ({ ...p, "tools_registry": [] }))),
        bridgeQueryKey("tools_runs_list").then(r => setData(p => ({ ...p, "tools_runs_list": r }))).catch(() => setData(p => ({ ...p, "tools_runs_list": [] }))),
        bridgeQueryKey("tools_sensors_list").then(r => setData(p => ({ ...p, "tools_sensors_list": r }))).catch(() => setData(p => ({ ...p, "tools_sensors_list": [] }))),
        bridgeQueryKey("tools_variants_list").then(r => setData(p => ({ ...p, "tools_variants_list": r }))).catch(() => setData(p => ({ ...p, "tools_variants_list": [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:tools · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      {Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SC label="Active" v={kpis["tools_total"]} ld={ld} />
          <SC label="Runs" v={kpis["tools_runs"]} ld={ld} />
          <SC label="Sessions" v={kpis["tools_sessions"]} ld={ld} />
          <SC label="Sensors" v={kpis["tools_sensors"]} ld={ld} />
          <SC label="Variants" v={kpis["tools_variants"]} ld={ld} />
        </div>
      )}
      <div className="space-y-4">
        <Sec title="Registry" n={(data["tools_registry"] || []).length}>
          <DT rows={data["tools_registry"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">tool_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">category</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">mode</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">production_state</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["tool_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["category"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["mode"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["production_state"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Runs" n={(data["tools_runs_list"] || []).length}>
          <DT rows={data["tools_runs_list"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">tool_id</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">evidence_class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">confidence_level</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">duration_ms</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">created_at</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["tool_id"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["evidence_class"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["confidence_level"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["duration_ms"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["created_at"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Sensors" n={(data["tools_sensors_list"] || []).length}>
          <DT rows={data["tools_sensors_list"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">dimension</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">description</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">captured_by_tool</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">data_type</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["dimension"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["description"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["captured_by_tool"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["data_type"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Variants" n={(data["tools_variants_list"] || []).length}>
          <DT rows={data["tools_variants_list"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">tool_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">variant_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">variation_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">confidence_level</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["tool_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["variant_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["variation_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["confidence_level"] ?? "—")}</td></tr>}
          />
        </Sec>
      </div>
    </div>
  );
};

export default ToolsPage;