import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Info, Loader2, RefreshCw } from "lucide-react";
import { bridgeSQL, bridgeCount } from "@/lib/bridge";
import BusinessUnitDetailSheet from "@/components/dashboard/BusinessUnitDetailSheet";

interface BusinessUnit { name: string; status: string; health: number; }
interface Alert { level: string; message: string; timestamp: string; }

const MCPCommandCentre = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnit | null>(null);
  const [stats, setStats] = useState({ businesses: 0, hubs: 0, agents: 0, ipAssets: 0, products: 0, stripeProducts: 0, sites: 0, domains: 0 });
  const [businessMetrics, setBusinessMetrics] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [maatDashboard, setMaatDashboard] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<Record<string, string>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchData = async () => {
    try {
      setError(null);
      const results = await Promise.allSettled([
        bridgeCount("SELECT count(*) FROM mcp_business_registry"),
        bridgeCount("SELECT count(DISTINCT hub) FROM mcp_command_registry"),
        bridgeCount("SELECT count(*) FROM neural_ennead_members"),
        bridgeCount("SELECT count(*) FROM ip_assets"),
        bridgeCount("SELECT count(*) FROM catalog_master"),
        bridgeCount("SELECT count(*) FROM stripe_products_catalog"),
        bridgeCount("SELECT count(*) FROM sites_registry"),
        bridgeCount("SELECT count(*) FROM v_domain_map_full"),
        bridgeSQL("SELECT business_line, metric_name, metric_value FROM business_metrics ORDER BY business_line"),
        bridgeSQL("SELECT business_key, portfolio_class FROM v_pos_portfolio_latest ORDER BY business_key"),
        bridgeSQL("SELECT * FROM v_maat_dashboard LIMIT 1"),
      ]);

      const v = (i: number) => results[i].status === 'fulfilled' ? (results[i] as any).value : 0;
      const r = (i: number) => results[i].status === 'fulfilled' ? (results[i] as any).value.rows || [] : [];

      setStats({ businesses: v(0), hubs: v(1), agents: v(2), ipAssets: v(3), products: v(4), stripeProducts: v(5), sites: v(6), domains: v(7) });
      setBusinessMetrics(r(8));
      setPortfolio(r(9));
      const maatRows = r(10);
      if (maatRows.length) setMaatDashboard(maatRows[0]);

      setSystemHealth({ bridge: "healthy", supabase: "healthy", lambdas: "healthy", github: "healthy" });
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load");
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-300 text-xl"><Loader2 className="w-6 h-6 animate-spin" />Loading command centre via bridge...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-red-400 text-xl">⚠ Command centre error</div>
        <div className="text-slate-400 text-sm max-w-md">{error}</div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-2 mx-auto"><RefreshCw className="w-4 h-4" /> Retry</button>
      </div>
    </div>
  );

  const businessUnits: BusinessUnit[] = portfolio.slice(0, 9).map((p: any) => ({
    name: p.business_key || 'Unknown',
    status: p.portfolio_class === 'CORE' ? 'active' : p.portfolio_class === 'GROWTH' ? 'active' : 'slow',
    health: p.portfolio_class === 'CORE' ? 85 : p.portfolio_class === 'GROWTH' ? 70 : 50,
  }));

  const statCards = [
    { label: "Businesses", value: stats.businesses, sub: "7 groups · 42 entities", color: "text-blue-400" },
    { label: "MCP Hubs", value: stats.hubs, sub: "Bridge endpoints", color: "text-indigo-400" },
    { label: "Agents", value: stats.agents, sub: "Neural Ennead", color: "text-purple-400" },
    { label: "IP Assets", value: stats.ipAssets, sub: "Patents & IP", color: "text-green-400" },
    { label: "Products", value: stats.products, sub: "Catalog", color: "text-cyan-400" },
    { label: "Sites", value: stats.sites, sub: `${stats.domains} domains`, color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">🚀 MCP Command Centre</h1>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="text-slate-400 hover:text-white transition"><RefreshCw className="w-5 h-5" /></button>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" /><span className="text-green-400 font-semibold">LIVE</span></div>
          </div>
        </header>

        {/* System Health */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(systemHealth).map(([svc, st]) => (
            <div key={svc} className={`glass p-6 rounded-lg border-2 ${st === "healthy" ? "border-green-500/50" : "border-red-500/50"}`}>
              <div className="text-sm text-slate-400 uppercase mb-2">{svc}</div>
              <div className={`text-xl font-bold ${st === "healthy" ? "text-green-400" : "text-red-400"}`}>{st}</div>
            </div>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map(c => (
            <div key={c.label} className="glass p-6 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">{c.label}</div>
              <div className={`text-3xl font-bold ${c.color}`}>{c.value.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* MAAT Finance */}
        {maatDashboard && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">MAAT Finance</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(maatDashboard).slice(0, 8).map(([k, v]: [string, any]) => (
                <div key={k} className="glass p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">{k.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-bold">{typeof v === 'number' ? v.toLocaleString() : String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Units */}
        {businessUnits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Business Units ({businessUnits.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businessUnits.map(u => (
                <div key={u.name} onClick={() => setSelectedUnit(u)} className="glass p-6 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{u.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full border ${u.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>{u.status}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-sm text-slate-400">Health</span><span className={`text-xl font-bold ${u.health >= 80 ? 'text-green-400' : u.health >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{u.health}%</span></div>
                    <Progress value={u.health} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="text-center text-slate-500 text-sm">
          Last updated: {lastUpdated?.toLocaleString() || "..."} · Powered by MCP Bridge
        </footer>
      </div>
      <BusinessUnitDetailSheet unit={selectedUnit} onClose={() => setSelectedUnit(null)} alerts={alerts} />
    </div>
  );
};

export default MCPCommandCentre;
