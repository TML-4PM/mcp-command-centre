import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";

type TabKey = "ip" | "content" | "books" | "products" | "infra" | "evidence";

const TABS: { key: TabKey; label: string; icon: string; color: string }[] = [
  { key: "ip",       label: "Research IP",   icon: "🧠", color: "blue"   },
  { key: "content",  label: "Content",       icon: "📝", color: "purple" },
  { key: "books",    label: "Books",         icon: "📚", color: "green"  },
  { key: "products", label: "Products",      icon: "💰", color: "yellow" },
  { key: "infra",    label: "Infrastructure",icon: "🌐", color: "cyan"   },
  { key: "evidence", label: "Evidence",      icon: "⚖️", color: "red"    },
];

const COLOR_MAP: Record<string, string> = {
  blue:   "border-blue-500/50 text-blue-400",
  purple: "border-purple-500/50 text-purple-400",
  green:  "border-green-500/50 text-green-400",
  yellow: "border-yellow-500/50 text-yellow-400",
  cyan:   "border-cyan-500/50 text-cyan-400",
  red:    "border-red-500/50 text-red-400",
};

const BADGE_MAP: Record<string, string> = {
  active:   "bg-green-500/15 text-green-400 border-green-500/30",
  ACTIVE:   "bg-green-500/15 text-green-400 border-green-500/30",
  owned:    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Created:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  production:"bg-green-500/15 text-green-400 border-green-500/30",
  default:  "bg-gray-700 text-gray-400 border-gray-600",
};

function badge(status?: string) {
  const cls = BADGE_MAP[status ?? ""] ?? BADGE_MAP.default;
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{status ?? "—"}</span>;
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder="Search..."
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:border-primary w-52"
    />
  );
}

// ── Tab: Research IP ──────────────────────────────────────────────────────────
function IPTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  useEffect(() => {
    bridgeSQL(`SELECT asset_name, asset_class, status, owner_entity, value_driver, protection_strategy
               FROM v_ip_assets_register_canonical
               ORDER BY asset_class, asset_name`)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const classes = ["all", ...Array.from(new Set(rows.map(r => r.asset_class).filter(Boolean)))];
  const filtered = rows.filter(r =>
    (classFilter === "all" || r.asset_class === classFilter) &&
    (!search || r.asset_name?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} />
        <div className="flex gap-2 flex-wrap">
          {classes.map(c => (
            <button key={c} onClick={() => setClassFilter(c)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${classFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500"}`}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} of {rows.length}</span>
      </div>
      <div className="grid gap-3">
        {filtered.map((r, i) => (
          <div key={i} className="glass p-4 rounded-lg border border-gray-800 hover:border-blue-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.asset_name}</p>
                {r.value_driver && <p className="text-xs text-gray-500 mt-0.5">{r.value_driver}</p>}
                {r.protection_strategy && <p className="text-xs text-gray-600 mt-0.5">{r.protection_strategy}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 font-mono">{r.asset_class}</span>
                {badge(r.status)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Content ──────────────────────────────────────────────────────────────
function ContentTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    bridgeSQL(`SELECT id, type, title, project, canonical_project
               FROM content_assets
               WHERE type IS NOT NULL
               ORDER BY type, updated_at DESC
               LIMIT 200`)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const types = ["all", ...Array.from(new Set(rows.map(r => r.type).filter(Boolean)))];
  const filtered = rows.filter(r =>
    (typeFilter === "all" || r.type === typeFilter) &&
    (!search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.project?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} />
        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500"}`}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} shown · 11,664 total</span>
      </div>
      <div className="grid gap-2">
        {filtered.map((r, i) => (
          <div key={i} className="glass px-4 py-3 rounded-lg border border-gray-800 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{r.title || "(no title)"}</p>
              {r.project && <p className="text-xs text-gray-600 font-mono">{r.canonical_project || r.project}</p>}
            </div>
            <span className="text-xs text-purple-400/70 font-mono shrink-0">{r.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Books ────────────────────────────────────────────────────────────────
function BooksTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    bridgeSQL(`SELECT id, asset_name, variant_name, content_length, time_state, signal_state
               FROM book_assets
               ORDER BY asset_name, variant_name
               LIMIT 200`)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r =>
    !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.variant_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} shown · 4,500 total</span>
      </div>
      <div className="grid gap-2">
        {filtered.map((r, i) => (
          <div key={i} className="glass px-4 py-3 rounded-lg border border-gray-800 hover:border-green-500/40 transition-all flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{r.asset_name}</p>
              {r.variant_name && <p className="text-xs text-gray-600">{r.variant_name}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500">
              {r.content_length ? `${Math.round(r.content_length / 1000)}k` : ""}
              {r.time_state && <span className="font-mono text-green-400/70">{r.time_state}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Products ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    bridgeSQL(`SELECT sku, product_name, category, subcategory, billing, price_aud, currency
               FROM stripe_products_master
               WHERE price_aud IS NOT NULL
               ORDER BY category, price_aud DESC
               LIMIT 200`)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cats = ["all", ...Array.from(new Set(rows.map(r => r.category).filter(Boolean)))];
  const filtered = rows.filter(r =>
    (catFilter === "all" || r.category === catFilter) &&
    (!search || r.product_name?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} />
        <div className="flex gap-2 flex-wrap">
          {cats.slice(0, 8).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${catFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500"}`}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} shown · 319 total</span>
      </div>
      <div className="grid gap-3">
        {filtered.map((r, i) => (
          <div key={i} className="glass px-4 py-3 rounded-lg border border-gray-800 hover:border-yellow-500/40 transition-all flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.product_name}</p>
              <p className="text-xs text-gray-500 font-mono">{r.sku}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-yellow-400 font-semibold text-sm">{r.price_aud ? `$${r.price_aud.toLocaleString()}` : "—"}</p>
              <p className="text-xs text-gray-600">{r.billing}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Infrastructure ───────────────────────────────────────────────────────
function InfraTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");

  useEffect(() => {
    bridgeSQL(`SELECT slug, site_name, display_name, zone, sub_zone, status, lifecycle_stage, hosting_pattern
               FROM sites_registry
               ORDER BY status, zone, site_name`)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const zones = ["all", ...Array.from(new Set(rows.map(r => r.zone).filter(Boolean)))];
  const filtered = rows.filter(r =>
    (zoneFilter === "all" || r.zone === zoneFilter) &&
    (!search || (r.site_name || r.display_name || r.slug)?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} />
        <div className="flex gap-2 flex-wrap">
          {zones.map(z => (
            <button key={z} onClick={() => setZoneFilter(z)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${zoneFilter === z ? "bg-primary text-primary-foreground border-primary" : "bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500"}`}>
              {z === "all" ? "All" : z}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} sites</span>
      </div>
      <div className="grid gap-2">
        {filtered.map((r, i) => (
          <div key={i} className="glass px-4 py-3 rounded-lg border border-gray-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.display_name || r.site_name}</p>
              <p className="text-xs text-gray-600 font-mono">{r.slug}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-gray-500">{r.zone}{r.sub_zone ? `/${r.sub_zone}` : ""}</span>
              {badge(r.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Evidence ─────────────────────────────────────────────────────────────
function EvidenceTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    bridgeSQL(`SELECT e.evidence_id, e.evidence_type, e.evidence_status, e.evidence_uri, e.evidence_note
               FROM evidence_binding e
               ORDER BY e.created_at DESC
               LIMIT 200`)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r =>
    !search || r.evidence_type?.toLowerCase().includes(search.toLowerCase()) ||
    r.evidence_uri?.toLowerCase().includes(search.toLowerCase()) ||
    r.evidence_note?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} shown · 454 total</span>
      </div>
      <div className="grid gap-2">
        {filtered.map((r, i) => (
          <div key={i} className="glass px-4 py-3 rounded-lg border border-gray-800 hover:border-red-500/40 transition-all flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono text-gray-400 truncate">{r.evidence_uri || "(no uri)"}</p>
              {r.evidence_note && <p className="text-xs text-gray-600 mt-0.5 truncate">{r.evidence_note}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500">{r.evidence_type}</span>
              {badge(r.evidence_status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading from bridge...</div>;
}

const COUNTS: Record<TabKey, string> = {
  ip:       "160 items",
  content:  "11,664 items",
  books:    "4,500 items",
  products: "319 items",
  infra:    "86 sites",
  evidence: "454 bindings",
};

const Assets = () => {
  const [tab, setTab] = useState<TabKey>("ip");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assets</h1>
        <p className="text-muted-foreground mt-1">31,100+ assets across 8 types · live via bridge</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-gray-800 pb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? `border-current ${COLOR_MAP[t.color]}`
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span className="text-xs text-gray-600 hidden sm:inline">{COUNTS[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "ip"       && <IPTab />}
        {tab === "content"  && <ContentTab />}
        {tab === "books"    && <BooksTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "infra"    && <InfraTab />}
        {tab === "evidence" && <EvidenceTab />}
      </div>
    </div>
  );
};

export default Assets;
