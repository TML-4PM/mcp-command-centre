import { useEffect, useState } from "react";
import { bridgeSQL } from "@/lib/bridge";

interface OverviewRow {
  businesses: number; groups: number; sites: number;
  products: number; ip_assets: number; hubs: number;
  agents: number; refreshed_at: string;
}
interface PortfolioItem {
  business_key: number; business_name: string; group_name: string;
  portfolio_role: string | null; what_it_is: string | null;
  confidence: string | null; updated_at: string;
}

const GROUP_META: Record<string, { color: string; icon: string }> = {
  CORE:    { color: "#4F7BFF", icon: "⚡" },
  SIGNAL:  { color: "#8C5BFF", icon: "📡" },
  MISSION: { color: "#20D9FF", icon: "🎯" },
  RETAIL:  { color: "#41E07C", icon: "🛍️" },
  FUN:     { color: "#FFCC4D", icon: "🎮" },
};

const STAT_DEFS = [
  { key: "businesses", label: "Businesses",  icon: "🏢", color: "#4F7BFF" },
  { key: "agents",     label: "Agents",       icon: "🤖", color: "#8C5BFF" },
  { key: "hubs",       label: "MCP Hubs",     icon: "🔗", color: "#20D9FF" },
  { key: "ip_assets",  label: "IP Assets",    icon: "🧠", color: "#FF6B6B" },
  { key: "products",   label: "Products",     icon: "📦", color: "#41E07C" },
  { key: "sites",      label: "Sites",        icon: "🌐", color: "#FFCC4D" },
] as const;

const Portfolio = () => {
  const [overview, setOverview]   = useState<OverviewRow | null>(null);
  const [items, setItems]         = useState<PortfolioItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [stale, setStale]         = useState(false);
  const [filterGroup, setFilter]  = useState<string>("ALL");

  useEffect(() => {
    Promise.allSettled([
      bridgeSQL("SELECT * FROM public.v_t4h_portfolio_health LIMIT 1"),
      bridgeSQL("SELECT * FROM public.v_t4h_portfolio_listing"),
    ]).then(([ovRes, listRes]) => {
      if (ovRes.status === "fulfilled") {
        const rows = ovRes.value?.rows ?? ovRes.value;
        setOverview(rows?.[0] ?? null);
      } else { setStale(true); }
      if (listRes.status === "fulfilled") {
        const rows = listRes.value?.rows ?? listRes.value;
        setItems(rows ?? []);
      } else { setError("Portfolio listing unavailable"); }
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-3 p-8 text-white/50">
      <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
      Loading portfolio...
    </div>
  );

  if (error && items.length === 0) return (
    <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
      <div className="font-semibold mb-1">Portfolio unavailable</div>
      <div className="text-red-400/70 font-mono text-xs">{error}</div>
    </div>
  );

  const groups = [...new Set(items.map(i => i.group_name))];
  const filtered = filterGroup === "ALL" ? items : items.filter(i => i.group_name === filterGroup);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Portfolio</h1>
          <p className="text-white/40 text-sm mt-1">
            {overview ? `${overview.businesses} businesses · ${overview.groups} groups` : "—"}
            {stale && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs">stale</span>}
          </p>
        </div>
        <div className="text-white/30 text-xs">{overview?.refreshed_at ? new Date(overview.refreshed_at).toLocaleTimeString("en-AU") : ""}</div>
      </div>

      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_DEFS.map(({ key, label, icon, color }) => (
            <div key={key} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07] transition">
              <div className="absolute inset-0 opacity-[0.06]" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
              <div className="text-xl mb-2">{icon}</div>
              <div className="text-2xl font-semibold text-white tabular-nums">{(overview as any)[key] ?? "—"}</div>
              <div className="text-xs text-white/40 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Group filter */}
      <div className="flex flex-wrap gap-2">
        {["ALL", ...groups].map(g => {
          const meta = GROUP_META[g] ?? { color: "#666", icon: "" };
          const active = filterGroup === g;
          return (
            <button key={g} onClick={() => setFilter(g)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition border"
              style={{
                borderColor: active ? meta.color : "rgba(255,255,255,0.12)",
                background: active ? `${meta.color}22` : "transparent",
                color: active ? meta.color : "rgba(255,255,255,0.5)",
              }}>
              {g !== "ALL" && <span className="mr-1">{meta.icon}</span>}{g}
            </button>
          );
        })}
      </div>

      {/* Business grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => {
          const meta = GROUP_META[item.group_name] ?? { color: "#6366F1", icon: "◆" };
          return (
            <div key={item.business_key}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.07] hover:border-white/20 transition">
              <div className="absolute inset-0 opacity-[0.05]"
                style={{ background: `linear-gradient(135deg, ${meta.color}, transparent 60%)` }} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{meta.icon}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${meta.color}22`, color: meta.color }}>
                    {item.group_name}
                  </span>
                </div>
                <div className="font-semibold text-white text-sm leading-tight">{item.business_name}</div>
                {item.what_it_is && (
                  <div className="text-white/40 text-xs mt-1.5 leading-snug line-clamp-2">{item.what_it_is}</div>
                )}
                {item.confidence && (
                  <div className="mt-3 text-[10px] text-white/25 uppercase tracking-wider">{item.confidence}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Portfolio;
