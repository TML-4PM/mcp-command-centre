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
    <div className="overflow-x-auto max-h-96">{c}</div>
  </div>
);

const badge = (s: string) => {
  const map: Record<string, string> = { LIVE: "bg-green-500/20 text-green-400 border-green-500/30", PARTIAL: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", SPEC: "bg-slate-500/20 text-slate-400 border-slate-600" };
  return <span className={`px-2 py-0.5 rounded text-xs border font-mono ${map[s] ?? map.SPEC}`}>{s}</span>;
};

const tierBadge = (t: string) => {
  const map: Record<string, string> = { free: "text-slate-400", starter: "text-blue-400", pro: "text-violet-400", enterprise: "text-amber-400" };
  return <span className={`text-xs font-mono ${map[t] ?? "text-slate-400"}`}>{t}</span>;
};

const WidgetCatalogPage = () => {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("wpc_full_inventory").then(r => setData(p => ({ ...p, inventory: r }))).catch(() => setData(p => ({ ...p, inventory: [] }))),
        bridgeQueryKey("wpc_by_bundle").then(r => setData(p => ({ ...p, bundles: r }))).catch(() => setData(p => ({ ...p, bundles: [] }))),
        bridgeQueryKey("wpc_status_breakdown").then(r => setData(p => ({ ...p, status: r }))).catch(() => setData(p => ({ ...p, status: [] }))),
        bridgeQueryKey("wpc_live_products").then(r => setData(p => ({ ...p, live: r }))).catch(() => setData(p => ({ ...p, live: [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const inv = data.inventory ?? [];
  const live = data.live ?? [];
  const bundles = data.bundles ?? [];
  const liveCount = inv.filter((r: any) => r.build_status === "LIVE").length;
  const paidLive = live.filter((r: any) => (r.price_aud_monthly ?? 0) > 0);
  const maxArr = paidLive.reduce((s: number, r: any) => s + Number(r.price_aud_monthly ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🧩 Widget Product Catalog</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:widget-catalog · live · widget_product_catalog</p>
        </div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50">
          {ld ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {err && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{err}</div>}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SC label="Total Products" v={inv.length} ld={ld} />
        <SC label="LIVE (Revenue-Ready)" v={liveCount} ld={ld} />
        <SC label="Stripe Wired" v={live.filter((r: any) => r.price_aud_monthly > 0).length} ld={ld} />
        <SC label="Max ARR / Customer (AUD)" v={maxArr ? `$${maxArr.toLocaleString()}/mo` : "—"} ld={ld} />
      </div>

      {/* Status + Bundle split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Sec title="Build Status" n={data.status?.length}>
          {ld ? <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div> :
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700"><th className="text-left p-3 text-slate-400 text-xs">Status</th><th className="text-right p-3 text-slate-400 text-xs">Count</th></tr></thead>
            <tbody>{(data.status ?? []).map((r: any, i: number) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="p-3">{badge(r.build_status)}</td>
                <td className="p-3 text-right font-mono text-white">{r.count}</td>
              </tr>
            ))}</tbody>
          </table>}
        </Sec>
        <Sec title="Bundle Groups" n={bundles.length}>
          {ld ? <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div> :
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700"><th className="text-left p-3 text-slate-400 text-xs">Bundle</th><th className="text-center p-3 text-slate-400 text-xs">Total</th><th className="text-center p-3 text-slate-400 text-xs">Live</th><th className="text-right p-3 text-slate-400 text-xs">Max AUD/mo</th></tr></thead>
            <tbody>{bundles.map((r: any, i: number) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="p-3 text-xs font-mono text-slate-300">{r.bundle_group ?? "—"}</td>
                <td className="p-3 text-center font-mono text-slate-400">{r.total}</td>
                <td className="p-3 text-center font-mono text-green-400">{r.live}</td>
                <td className="p-3 text-right font-mono text-white">${Number(r.max_arr_aud ?? 0).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>}
        </Sec>
      </div>

      {/* Full inventory */}
      <Sec title="Full Product Inventory" n={inv.length}>
        {ld ? <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div> :
        !inv.length ? <div className="flex items-center justify-center h-16 text-slate-600 text-sm">No data</div> :
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 sticky top-0 bg-slate-900">
              <th className="text-left p-3 text-slate-400 text-xs">#</th>
              <th className="text-left p-3 text-slate-400 text-xs">Product</th>
              <th className="text-left p-3 text-slate-400 text-xs">Category</th>
              <th className="text-left p-3 text-slate-400 text-xs">Status</th>
              <th className="text-left p-3 text-slate-400 text-xs">Tier</th>
              <th className="text-right p-3 text-slate-400 text-xs">AUD/mo</th>
              <th className="text-left p-3 text-slate-400 text-xs">Bundle</th>
              <th className="text-center p-3 text-slate-400 text-xs">RDTI</th>
            </tr>
          </thead>
          <tbody>
            {inv.map((r: any, i: number) => (
              <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                <td className="p-3 text-slate-600 font-mono text-xs">{i + 1}</td>
                <td className="p-3">
                  <div className="font-medium text-white text-sm">{r.product_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.tagline}</div>
                </td>
                <td className="p-3 text-xs text-slate-400">{r.category_label}</td>
                <td className="p-3">{badge(r.build_status)}</td>
                <td className="p-3">{tierBadge(r.pricing_tier)}</td>
                <td className="p-3 text-right font-mono text-white text-sm">{r.price_aud_monthly > 0 ? `$${r.price_aud_monthly}` : <span className="text-slate-600">free</span>}</td>
                <td className="p-3 text-xs text-slate-500 font-mono">{(r.bundle_group ?? "").replace(/_/g, " ")}</td>
                <td className="p-3 text-center text-xs">{r.rdti_eligible ? <span className="text-green-400">✓</span> : <span className="text-slate-600">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </Sec>
    </div>
  );
};

export default WidgetCatalogPage;
