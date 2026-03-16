import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAT_CARDS = [
  { key: "overview_biz_count",     label: "Businesses",  icon: "🏢", sub: "28 canonical", color: "blue" },
  { key: "overview_agent_count",   label: "Agents",      icon: "🤖", sub: "Neural Ennead", color: "purple" },
  { key: "overview_hub_count",     label: "MCP Hubs",    icon: "⚡", sub: "Bridge endpoints", color: "cyan" },
  { key: "overview_ip_count",      label: "IP Assets",   icon: "🔬", sub: "Patents & IP", color: "green" },
  { key: "overview_stripe_count",  label: "Products",    icon: "📦", sub: "Stripe linked", color: "amber" },
  { key: "overview_sites_count",   label: "Sites",       icon: "🌐", sub: "Active domains", color: "rose" },
  { key: "overview_catalog_count", label: "Catalog SKUs",icon: "🛍️", sub: "All products", color: "indigo" },
  { key: "overview_domains_count", label: "Domains",     icon: "🗺️", sub: "Mapped", color: "teal" },
];

const COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400", purple: "text-purple-400", cyan: "text-cyan-400",
  green: "text-green-400", amber: "text-amber-400", rose: "text-rose-400",
  indigo: "text-indigo-400", teal: "text-teal-400",
};

const getVal = (rows: any[]): string => {
  if (!rows?.length) return "—";
  const r = rows[0];
  const v = r.count ?? r.total ?? r.c ?? Object.values(r)[0];
  return v != null ? String(v) : "—";
};

const Dashboard = () => {
  const [stats, setStats] = useState<Record<string, string>>({});
  const [maat, setMaat] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [lc, setLc] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState("");
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        STAT_CARDS.map(c => bridgeQueryKey(c.key))
      );
      const map: Record<string, string> = {};
      STAT_CARDS.forEach((c, i) => {
        const r = results[i];
        map[c.key] = r.status === "fulfilled" ? getVal(r.value) : "—";
      });
      setStats(map);
      setBridgeOk(true);

      const [maatR, portR, lcTotalR, lcAlertR, lcHighR] = await Promise.allSettled([
        bridgeQueryKey("overview_maat_dashboard"),
        bridgeQueryKey("overview_portfolio"),
        bridgeQueryKey("overview_lc_total"),
        bridgeQueryKey("overview_lc_alerts"),
        bridgeQueryKey("overview_lc_high_risk"),
      ]);
      if (maatR.status === "fulfilled") setMaat(maatR.value[0] ?? null);
      if (portR.status === "fulfilled") setPortfolio(portR.value ?? []);
      if (lcTotalR.status === "fulfilled" || lcAlertR.status === "fulfilled" || lcHighR.status === "fulfilled") {
        setLc({
          total: getVal(lcTotalR.status === "fulfilled" ? lcTotalR.value : []),
          alerts: getVal(lcAlertR.status === "fulfilled" ? lcAlertR.value : []),
          high: getVal(lcHighR.status === "fulfilled" ? lcHighR.value : []),
        });
      }
    } catch (e) {
      setBridgeOk(false);
    }
    setLastCheck(new Date().toLocaleTimeString("en-AU"));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { setRefreshing(true); load(); };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">T4H Command Centre</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {bridgeOk === true && <span className="text-green-400">● Bridge Live</span>}
            {bridgeOk === false && <span className="text-red-400">● Bridge Degraded</span>}
            {bridgeOk === null && <span className="text-slate-500">● Connecting…</span>}
            {lastCheck && <span className="text-slate-500 ml-3">Last refresh {lastCheck}</span>}
          </p>
        </div>
        <Button onClick={refresh} disabled={refreshing} size="sm" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {STAT_CARDS.map(c => (
          <div key={c.key} className="glass rounded-lg border border-border p-4 flex flex-col gap-1">
            <span className="text-xl">{c.icon}</span>
            <span className={`text-2xl font-bold ${COLOR_MAP[c.color]} ${loading ? "animate-pulse" : ""}`}>
              {loading ? "…" : (stats[c.key] ?? "—")}
            </span>
            <span className="text-xs font-medium">{c.label}</span>
            <span className="text-[10px] text-muted-foreground">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* MAAT row */}
      {maat && (
        <div className="glass rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">💰 MAAT Financial</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {Object.entries(maat).map(([k, v]) => (
              <div key={k}>
                <div className="text-muted-foreground capitalize text-xs mb-0.5">{k.replace(/_/g," ")}</div>
                <div className="font-semibold">{v != null ? String(v) : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Living Cells + Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Living Cells */}
        <div className="glass rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">🧬 Living Cells</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-cyan-400">{lc.total ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{lc.alerts ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">Alerts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{lc.high ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">High Risk</div>
            </div>
          </div>
        </div>

        {/* Portfolio by group */}
        <div className="glass rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">🗂️ Portfolio</h2>
          {portfolio.length === 0 ? (
            <p className="text-muted-foreground text-sm">{loading ? "Loading…" : "No data"}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {Object.keys(portfolio[0]).map(k => (
                      <th key={k} className="text-left pb-2 pr-3 text-muted-foreground capitalize">{k.replace(/_/g," ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.slice(0,10).map((row, i) => (
                    <tr key={i} className="border-b border-border/40">
                      {Object.values(row).map((v: any, j) => (
                        <td key={j} className="py-1.5 pr-3">{v != null ? String(v) : "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
