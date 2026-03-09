import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Loader2, RefreshCw, TrendingUp, Users, Zap, Package, ChevronDown, ChevronRight, ExternalLink, Target, DollarSign, Radio } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Brand {
  brand_code: string;
  brand_name: string;
  group_code: string;
  group_name: string;
}
interface Sku {
  sku: string;
  brand_code: string;
  display_name: string;
  type_code: string;
  tier_code: string;
  starter_price_aud: number | null;
  monthly_price_aud: number | null;
  wl_price_aud: number | null;
  category_tag: string | null;
  operational_status: string;
  agent_count: number | null;
}
interface FivePs {
  brand_code: string;
  icp: string;
  trigger_event: string;
  demand_signal: string;
  promo_angle: string;
  price_anchor: string;
  delivery_channel: string;
  offer_ladder: string;
  cross_sell_keys: string[];
}
interface ProductPlan {
  brand_code: string;
  product_key: string;
  rank: number;
  rationale: string;
  icp_primary: string;
  trigger_event: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GROUP_COLORS: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
  "G1": { bg: "bg-blue-950/40",   border: "border-blue-500/30",  badge: "bg-blue-500/20 text-blue-300",  dot: "bg-blue-400" },
  "G2": { bg: "bg-purple-950/40", border: "border-purple-500/30", badge: "bg-purple-500/20 text-purple-300", dot: "bg-purple-400" },
  "G3": { bg: "bg-emerald-950/40",border: "border-emerald-500/30",badge: "bg-emerald-500/20 text-emerald-300",dot: "bg-emerald-400" },
  "G4": { bg: "bg-amber-950/40",  border: "border-amber-500/30", badge: "bg-amber-500/20 text-amber-300", dot: "bg-amber-400" },
  "G5": { bg: "bg-pink-950/40",   border: "border-pink-500/30",  badge: "bg-pink-500/20 text-pink-300",   dot: "bg-pink-400" },
};
const GROUP_LABELS: Record<string, string> = {
  "G1": "CORE", "G2": "SIGNAL", "G3": "MISSION", "G4": "RETAIL", "G5": "FUN",
};
const TIER_LABEL: Record<string, string> = { L0: "Free", L1: "Entry", L2: "Core", L3: "Premium", L4: "Enterprise" };
const STATUS_DOT: Record<string, string> = {
  live: "bg-green-400", operational: "bg-green-400", seeded: "bg-amber-400",
  draft: "bg-slate-400", beta: "bg-blue-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtPrice = (n: number | null) => n == null ? null : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toLocaleString()}`;

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${color}`}>
    <span className="opacity-60">{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

const SkuRow = ({ sku }: { sku: Sku }) => {
  const starter = fmtPrice(sku.starter_price_aud);
  const monthly = fmtPrice(sku.monthly_price_aud);
  const statusKey = (sku.operational_status || "").toLowerCase();
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors group">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[statusKey] || "bg-slate-500"}`} />
      <span className="text-xs text-slate-300 flex-1 min-w-0 truncate" title={sku.display_name}>{sku.display_name}</span>
      <span className="text-xs text-slate-500 hidden group-hover:block">{TIER_LABEL[sku.tier_code] || sku.tier_code}</span>
      {sku.agent_count && <span className="text-xs text-purple-400 tabular-nums">{sku.agent_count}a</span>}
      <div className="flex gap-1 flex-shrink-0">
        {starter && <span className="text-xs font-mono text-green-400">{starter}</span>}
        {monthly && <span className="text-xs font-mono text-blue-400">{monthly}/mo</span>}
        {!starter && !monthly && <span className="text-xs text-slate-600">—</span>}
      </div>
    </div>
  );
};

const FivePsPanel = ({ ps }: { ps: FivePs }) => (
  <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 gap-2 text-xs">
    <div className="flex gap-2">
      <Target className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
      <div><span className="text-slate-400">ICP: </span><span className="text-slate-200">{ps.icp}</span></div>
    </div>
    <div className="flex gap-2">
      <Radio className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
      <div><span className="text-slate-400">Trigger: </span><span className="text-slate-200">{ps.trigger_event}</span></div>
    </div>
    <div className="flex gap-2">
      <Zap className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
      <div><span className="text-slate-400">Angle: </span><span className="text-slate-200 italic">"{ps.promo_angle}"</span></div>
    </div>
    <div className="flex gap-2">
      <DollarSign className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
      <div><span className="text-slate-400">Ladder: </span><span className="text-slate-300">{ps.offer_ladder}</span></div>
    </div>
    {ps.cross_sell_keys?.length > 0 && (
      <div className="flex gap-2 flex-wrap pt-0.5">
        <span className="text-slate-400">Cross-sell: </span>
        {ps.cross_sell_keys.map(k => (
          <span key={k} className="px-1.5 py-0.5 bg-white/5 rounded text-slate-300">{k}</span>
        ))}
      </div>
    )}
  </div>
);

const ProductPlanList = ({ plan }: { plan: ProductPlan[] }) => (
  <div className="mt-3 pt-3 border-t border-white/10">
    <p className="text-xs text-slate-400 mb-2 font-medium">TOP 5 PRODUCT PRIORITIES</p>
    <div className="space-y-1">
      {plan.sort((a,b) => a.rank - b.rank).map(p => (
        <div key={p.product_key} className="flex gap-2 text-xs">
          <span className="text-slate-500 tabular-nums w-4 flex-shrink-0">{p.rank}.</span>
          <div>
            <span className="text-slate-200 font-medium">{p.product_key.replace(/_/g," ")}</span>
            <span className="text-slate-400 ml-1">— {p.rationale}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BrandCard = ({
  brand, skus, ps, plan,
}: { brand: Brand; skus: Sku[]; ps: FivePs | null; plan: ProductPlan[] }) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"skus"|"5ps"|"plan">("skus");
  const gc = GROUP_COLORS[brand.group_code] || GROUP_COLORS["G1"];
  const priced = skus.filter(s => s.starter_price_aud || s.monthly_price_aud);
  const maxPrice = Math.max(0, ...skus.map(s => s.starter_price_aud || s.monthly_price_aud || 0));
  const totalAgents = skus.reduce((a, s) => a + (s.agent_count || 0), 0);

  return (
    <div className={`rounded-xl border ${gc.bg} ${gc.border} overflow-hidden transition-all duration-200`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white truncate">{brand.brand_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${gc.badge}`}>{brand.brand_code}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <StatPill label="SKUs" value={skus.length} color="border-slate-700 text-slate-300" />
            <StatPill label="priced" value={priced.length} color="border-emerald-800/50 text-emerald-400" />
            {maxPrice > 0 && <StatPill label="max" value={fmtPrice(maxPrice)!} color="border-green-800/50 text-green-400" />}
            {totalAgents > 0 && <StatPill label="agents" value={totalAgents} color="border-purple-800/50 text-purple-400" />}
          </div>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${gc.dot}`} />
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-white/10 p-3">
          {/* Tab bar */}
          <div className="flex gap-1 mb-3">
            {(["skus","5ps","plan"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab === t ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"}`}>
                {t === "skus" ? `SKUs (${skus.length})` : t === "5ps" ? "5Ps" : "Product Plan"}
              </button>
            ))}
          </div>

          {tab === "skus" && (
            <div className="space-y-0.5">
              {skus.length === 0
                ? <p className="text-xs text-slate-500 py-2 text-center">No SKUs seeded yet</p>
                : skus.map(s => <SkuRow key={s.sku} sku={s} />)
              }
            </div>
          )}
          {tab === "5ps" && (
            ps
              ? <FivePsPanel ps={ps} />
              : <p className="text-xs text-slate-500 py-2 text-center">No 5Ps data yet</p>
          )}
          {tab === "plan" && (
            plan.length > 0
              ? <ProductPlanList plan={plan} />
              : <p className="text-xs text-slate-500 py-2 text-center">No product plan yet</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Dossier = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [skuMap, setSkuMap] = useState<Record<string, Sku[]>>({});
  const [psMap, setPsMap] = useState<Record<string, FivePs>>({});
  const [planMap, setPlanMap] = useState<Record<string, ProductPlan[]>>({});
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, skuRes, psRes, planRes] = await Promise.all([
        bridgeSQL(`SELECT brand_code, brand_name, group_code, group_name FROM t4h_dim_brand WHERE group_code IN ('G1','G2','G3','G4','G5') ORDER BY group_code, brand_name`),
        bridgeSQL(`SELECT sku, brand_code, display_name, type_code, tier_code, starter_price_aud, monthly_price_aud, wl_price_aud, category_tag, operational_status, agent_count FROM t4h_sku ORDER BY brand_code, sku`),
        bridgeSQL(`SELECT brand_code, icp, trigger_event, demand_signal, promo_angle, price_anchor, delivery_channel, offer_ladder, cross_sell_keys FROM t4h_product_5ps`),
        bridgeSQL(`SELECT brand_code, product_key, rank, rationale, icp_primary, trigger_event FROM t4h_business_product_plan ORDER BY brand_code, rank`),
      ]);
      setBrands(bRes.rows);
      const sm: Record<string, Sku[]> = {};
      for (const s of skuRes.rows) { (sm[s.brand_code] = sm[s.brand_code] || []).push(s); }
      setSkuMap(sm);
      const pm: Record<string, FivePs> = {};
      for (const p of psRes.rows) { pm[p.brand_code] = p; }
      setPsMap(pm);
      const plm: Record<string, ProductPlan[]> = {};
      for (const p of planRes.rows) { (plm[p.brand_code] = plm[p.brand_code] || []).push(p); }
      setPlanMap(plm);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = [...new Set(brands.map(b => b.group_code))].sort();
  const filtered = brands.filter(b => {
    if (filterGroup !== "all" && b.group_code !== filterGroup) return false;
    if (search && !b.brand_name.toLowerCase().includes(search.toLowerCase()) && !b.brand_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const allSkus = Object.values(skuMap).flat();
  const pricedSkus = allSkus.filter(s => s.starter_price_aud || s.monthly_price_aud);
  const totalAgents = allSkus.reduce((a, s) => a + (s.agent_count || 0), 0);
  const totalBrands = brands.length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <span className="ml-3 text-slate-300">Loading portfolio dossier…</span>
    </div>
  );
  if (error) return (
    <div className="p-6 text-red-400 bg-red-950/20 rounded-xl border border-red-800/30">{error}</div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📋 <span>Business Dossier</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">T4H canonical portfolio — SKUs · 5Ps · Product plans</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Package className="w-5 h-5 text-blue-400"/>, label: "Commercial Brands", value: totalBrands, sub: "5 groups" },
          { icon: <TrendingUp className="w-5 h-5 text-green-400"/>, label: "Total SKUs", value: allSkus.length, sub: `${pricedSkus.length} priced` },
          { icon: <Zap className="w-5 h-5 text-purple-400"/>, label: "Total Agents", value: totalAgents, sub: "HOLO stack" },
          { icon: <Users className="w-5 h-5 text-amber-400"/>, label: "5Ps Mapped", value: Object.keys(psMap).length, sub: "of " + totalBrands },
        ].map(({ icon, label, value, sub }) => (
          <div key={label} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            {icon}
            <div>
              <p className="text-xl font-bold text-white tabular-nums">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-xs text-slate-600">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search brand…"
          className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-40"
        />
        <button
          onClick={() => setFilterGroup("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterGroup === "all" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
        >All</button>
        {groups.map(g => {
          const gc = GROUP_COLORS[g] || GROUP_COLORS["G1"];
          return (
            <button key={g}
              onClick={() => setFilterGroup(filterGroup === g ? "all" : g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterGroup === g ? `${gc.badge} ${gc.border}` : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {g} · {GROUP_LABELS[g]}
            </button>
          );
        })}
      </div>

      {/* Brand grid — responsive columns */}
      {groups.filter(g => filterGroup === "all" || filterGroup === g).map(g => {
        const groupBrands = filtered.filter(b => b.group_code === g);
        if (!groupBrands.length) return null;
        const gc = GROUP_COLORS[g];
        return (
          <div key={g}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${gc.dot}`} />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{g} · {GROUP_LABELS[g]}</h2>
              <span className="text-xs text-slate-500">({groupBrands.length} brands)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {groupBrands.map(b => (
                <BrandCard
                  key={b.brand_code}
                  brand={b}
                  skus={skuMap[b.brand_code] || []}
                  ps={psMap[b.brand_code] || null}
                  plan={planMap[b.brand_code] || []}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Dossier;
