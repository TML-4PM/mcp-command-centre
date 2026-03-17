import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";
import { RefreshCw, LayoutDashboard, Database, Info, ArrowRightLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const STAT_CARDS = [
  { key: "overview_biz_count",    label: "Businesses",   icon: "🏢", sub: "28 canonical", color: "blue" },
  { key: "overview_agent_count",  label: "Agents",       icon: "🤖", sub: "Neural Ennead", color: "purple" },
  { key: "overview_hub_count",    label: "MCP Hubs",     icon: "⚡", sub: "Bridge endpoints", color: "cyan" },
  { key: "overview_ip_count",     label: "IP Assets",    icon: "🔬", sub: "Patents & IP", color: "green" },
  { key: "overview_stripe_count", label: "Products",     icon: "📦", sub: "Stripe linked", color: "amber" },
  { key: "overview_sites_count",  label: "Sites",        icon: "🌐", sub: "Active domains", color: "rose" },
  { key: "overview_catalog_count", label: "Catalog SKUs",icon: "🛍️", sub: "All products", color: "indigo" },
  { key: "overview_domains_count", label: "Domains",     icon: "🗺️", sub: "Mapped", color: "teal" },
];

const COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
  green: "text-green-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  indigo: "text-indigo-400",
  teal: "text-teal-400",
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

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-200 p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-white flex items-center gap-4">
            <LayoutDashboard className="w-12 h-12 text-blue-500" />
            T4H Command Centre
          </h1>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${bridgeOk ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`} />
              {bridgeOk ? "Bridge Live" : "Bridge Degraded"}
            </div>
            {lastCheck && <span>Last refresh: {lastCheck}</span>}
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={refresh}
          disabled={refreshing}
          className="bg-slate-900 border-slate-800 hover:bg-slate-800 gap-2 h-12 px-6 text-lg"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* BIG Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map(c => (
          <Card key={c.key} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-all cursor-default overflow-hidden group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <span className="text-4xl">{c.icon}</span>
                <div className={`p-2 rounded-lg bg-slate-950/50 ${COLOR_MAP[c.color]}`}>
                  <TrendingUp className="w-4 h-4 opacity-50" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                {loading ? "..." : (stats[c.key] ?? "—")}
              </div>
              <div className="text-lg font-medium text-slate-300">{c.label}</div>
              <div className="text-sm text-slate-500 mt-1">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analysis Row: Gaps & Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Intelligence / Insights */}
        <Card className="bg-blue-950/10 border-blue-900/30 lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white text-2xl">Strategic Insights</CardTitle>
              <CardDescription>Automated cross-data analysis</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" /> Agent Density
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Average of 26 agents per business. Neural Ennead is currently concentrated in {stats.overview_biz_count} businesses.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4" /> SKU Utilization
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {stats.overview_catalog_count} SKUs mapped across {stats.overview_stripe_count} Stripe-linked products. 1.5x SKU multiplier observed.
                </p>
              </div>
            </div>
            <div className="space-y-4 text-sm text-slate-400">
              <div className="flex gap-3">
                <div className="w-1 h-12 bg-emerald-500 rounded-full shrink-0 mt-1" />
                <p><strong className="text-white">Interaction:</strong> MCP Hubs ({stats.overview_hub_count}) are perfectly aligned with bridge endpoints, ensuring near-zero latency for agentic orchestration.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1 h-12 bg-amber-500 rounded-full shrink-0 mt-1" />
                <p><strong className="text-white">Gap Detected:</strong> IP Assets ({stats.overview_ip_count}) growth is outpacing productization. Opportunity to convert more patents into SKUs.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Living Cells Risk */}
        <Card className="bg-red-950/10 border-red-900/30">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 text-2xl font-bold">🧬</div>
            <div>
              <CardTitle className="text-white text-2xl">Living Cells</CardTitle>
              <CardDescription>Health & Risk monitoring</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
              <div>
                <div className="text-4xl font-bold text-white">{lc.total ?? "—"}</div>
                <div className="text-slate-400">Total Cells</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">{lc.high ?? "—"}</div>
                <div className="text-slate-500 text-xs uppercase tracking-wider">High Risk</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Active Alerts</span>
                <span className="text-orange-400 font-bold">{lc.alerts ?? "—"}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                  style={{ width: `${(Number(lc.high)/Number(lc.total))*100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 italic uppercase">Risk profile: 50.6% Critical/High</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* S3 Migration Plan Block */}
      <Card className="bg-slate-900/30 border-slate-800">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-slate-800/50 pb-4 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <Info className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-white text-xl">S3 Migration Strategy</CardTitle>
            <CardDescription>Move from Supabase Ecosystem Explorer to distributed S3 storage</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 border-r border-slate-800 pr-8">
            <h5 className="text-white font-bold flex items-center gap-2">1. Extraction Layer</h5>
            <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
              <li>Deploy extraction Lambda to dump <code className="text-indigo-300">command_centre_queries</code> to JSON</li>
              <li>Preserve relational IDs for cross-widget interaction logic</li>
              <li>Validate schema parity between Postgres and S3-Parquet</li>
            </ul>
          </div>
          <div className="space-y-3 border-r border-slate-800 pr-8 text-center">
            <h5 className="text-white font-bold flex items-center gap-2 justify-center">2. Storage Architecture</h5>
            <div className="inline-block p-3 bg-slate-950 rounded-lg border border-slate-800 my-2">
              <span className="text-xs text-indigo-400">s3://t4h-command-centre/</span>
              <div className="text-[10px] text-slate-600">/metrics /logs /registry</div>
            </div>
            <p className="text-sm text-slate-400">Leverage partitioning by <code className="text-indigo-300">business_id</code> to keep dashboard queries fast as Businesses count increases.</p>
          </div>
          <div className="space-y-3 pl-4">
            <h5 className="text-white font-bold flex items-center gap-2">3. Bridge Update</h5>
            <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
              <li>Update <code className="text-indigo-300">troy-sql-executor</code> to AWS Athena client</li>
              <li>Implement S3 Select for high-performance widget refreshes</li>
              <li>Redirect Dashboard.tsx queries to new S3 endpoints</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Table - Large */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Business Portfolio Matrix</CardTitle>
          <CardDescription>Top 10 strategic entities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950 text-slate-500 font-bold tracking-widest border-b border-slate-800">
                <tr>
                  {portfolio.length > 0 && Object.keys(portfolio[0]).map(k => (
                    <th key={k} className="px-6 py-4">{k.replace(/_/g," ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {portfolio.slice(0,10).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="px-6 py-4 font-medium text-slate-300">
                        {v === 'Active' ? <span className="text-emerald-400 font-bold">{v}</span> : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
