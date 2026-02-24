import { useEffect, useState } from "react";

const BRIDGE = "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";

async function bridgeSQL(sql: string) {
  const res = await fetch(BRIDGE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ functionName: "troy-sql-executor", payload: { sql } }),
  });
  const data = await res.json();
  const body = typeof data.result?.body === "string" ? JSON.parse(data.result.body) : data.result?.body;
  if (body?.error) throw new Error(body.error);
  return body?.rows ?? [];
}

function fmt(n: number | null, prefix = "$") {
  if (n == null) return "—";
  return prefix + Math.abs(n).toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

function MetricTile({ label, value, sub, color = "default" }: { label: string; value: string; sub?: string; color?: string }) {
  const border = color === "green" ? "border-green-500/40" : color === "blue" ? "border-blue-500/40" : color === "yellow" ? "border-yellow-500/40" : color === "red" ? "border-red-500/40" : "border-gray-800";
  const text = color === "green" ? "text-green-400" : color === "blue" ? "text-blue-400" : color === "yellow" ? "text-yellow-400" : color === "red" ? "text-red-400" : "text-white";
  return (
    <div className={`glass p-5 rounded-lg border ${border}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

type TabKey = "maat" | "paye" | "products" | "health";

const TABS = [
  { key: "maat" as TabKey,     label: "MAAT / R&D",      icon: "📊" },
  { key: "paye" as TabKey,     label: "Personal Tax",     icon: "👤" },
  { key: "products" as TabKey, label: "Products",         icon: "💰" },
  { key: "health" as TabKey,   label: "System Health",    icon: "🔧" },
];

// ── MAAT Tab ──────────────────────────────────────────────────────────────────
function MAATTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bridgeSQL("SELECT * FROM v_maat_api_dashboard LIMIT 1")
      .then(rows => {
        if (rows[0]?.dashboard_json) {
          const d = typeof rows[0].dashboard_json === "string"
            ? JSON.parse(rows[0].dashboard_json)
            : rows[0].dashboard_json;
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data) return <Empty msg="No MAAT data" />;

  const s = data.summary ?? {};
  const taxRows: any[] = data.tax_position ?? [];
  const digest = data.weekly_digest ?? {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricTile label="Total Spend"    value={fmt(s.total_spend)}   color="default" />
        <MetricTile label="R&D Spend"      value={fmt(s.rd_spend)}      color="blue"    />
        <MetricTile label="R&D Rebate"     value={fmt(s.rd_rebate)}     color="green"   />
        <MetricTile label="GST Refund"     value={fmt(s.gst_refund)}    color="yellow"  />
        <MetricTile label="Total Tx"       value={(s.total_tx ?? "—").toLocaleString()} color="default" sub={`${s.rd_matches ?? "—"} R&D matches`} />
        <MetricTile label="Active Grants"  value={String(s.active_grants ?? "—")}       color="blue"    sub={`${s.closing_soon ?? 0} closing soon`} />
      </div>

      {/* Tax Position by Entity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Tax Position by Entity</h2>
        <div className="grid gap-3">
          {taxRows.map((row, i) => (
            <div key={i} className="glass p-4 rounded-lg border border-gray-800 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <p className="text-xs text-gray-500">Entity</p>
                <p className="font-medium text-sm">{row.entity}</p>
                <p className="text-xs text-gray-600">{row.tax_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Expenses</p>
                <p className="text-yellow-400 font-semibold">{fmt(row.total_expenses)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">R&D Rebate</p>
                <p className="text-green-400 font-semibold">{fmt(row.rd_rebate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">GST Refund</p>
                <p className="text-blue-400 font-semibold">{fmt(row.gst_refund)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tax Withheld</p>
                <p className="font-semibold">{fmt(row.tax_withheld)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAAT Health */}
      <div>
        <h2 className="text-lg font-semibold mb-3">MAAT Health</h2>
        <MaatHealth />
      </div>
    </div>
  );
}

function MaatHealth() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    bridgeSQL("SELECT * FROM v_maat_api_health LIMIT 1")
      .then(r => setRows(r)).catch(() => {});
  }, []);

  if (!rows.length) return null;
  const h = rows[0];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Object.entries(h).map(([k, v]) => {
        const bad = typeof v === "number" && v > 0 && (k.includes("error") || k.includes("unbalanced") || k.includes("under") || k.includes("null"));
        return (
          <div key={k} className={`glass p-3 rounded border ${bad ? "border-red-500/40" : "border-gray-800"}`}>
            <p className="text-xs text-gray-500 mb-1">{k.replace(/_/g, " ")}</p>
            <p className={`font-semibold ${bad ? "text-red-400" : "text-white"}`}>{String(v ?? "—")}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── PAYE Tab ──────────────────────────────────────────────────────────────────
function PAYETab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bridgeSQL("SELECT * FROM v_paye_summary LIMIT 20")
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => {
        // Fallback: personal tax position
        bridgeSQL("SELECT * FROM v_personal_tax_position LIMIT 20")
          .then(r2 => { setRows(r2); setLoading(false); })
          .catch(() => setLoading(false));
      });
  }, []);

  if (loading) return <Loader />;
  if (!rows.length) return <Empty msg="No PAYE data found (v_paye_summary empty)" />;

  const cols = Object.keys(rows[0]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Source: v_paye_summary · {rows.length} rows</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {cols.map(c => <th key={c} className="text-left text-xs text-gray-500 px-3 py-2 font-normal">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-900 hover:bg-gray-900/40">
                {cols.map(c => <td key={c} className="px-3 py-2 text-xs text-gray-300">{r[c] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bridgeSQL("SELECT * FROM v_product_dashboard ORDER BY source LIMIT 50")
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!rows.length) return <Empty msg="No product data" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {rows.map((r, i) => (
          <div key={i} className="glass p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{r.source || "Unknown"}</p>
            <p className="text-2xl font-bold text-white">{r.total ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-1">{r.active ?? "—"} active · {r.linked_to_stripe ?? "—"} Stripe-linked</p>
          </div>
        ))}
      </div>
      <CatalogKPI />
    </div>
  );
}

function CatalogKPI() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    bridgeSQL("SELECT * FROM v_catalog_kpi LIMIT 10")
      .then(r => setRows(r)).catch(() => {});
  }, []);
  if (!rows.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-3">Catalog KPIs</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800">{cols.map(c => <th key={c} className="text-left text-xs text-gray-500 px-3 py-2 font-normal">{c}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-gray-900">{cols.map(c => <td key={c} className="px-3 py-2 text-xs text-gray-300">{r[c] ?? "—"}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── System Health Tab ─────────────────────────────────────────────────────────
function HealthTab() {
  const [sys, setSys] = useState<any>(null);
  const [bridge, setBridge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bridgeSQL("SELECT * FROM v_system_health_summary LIMIT 1"),
      bridgeSQL("SELECT * FROM v_bridge_health LIMIT 1"),
    ]).then(([s, b]) => {
      setSys(s[0] ?? null);
      setBridge(b[0] ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {sys && (
        <div>
          <h2 className="text-lg font-semibold mb-3">System Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricTile label="Calls (24h)"   value={String(sys.calls_last_24h ?? "—")} color="blue" />
            <MetricTile label="Errors (24h)"  value={String(sys.errors_last_24h ?? "—")} color={sys.errors_last_24h > 0 ? "red" : "green"} />
            <MetricTile label="Unacked Alerts" value={String(sys.unacked_alerts ?? "—")} color={sys.unacked_alerts > 0 ? "yellow" : "green"} />
            <MetricTile label="Partners OK"   value={String(sys.partners_ok ?? "—")}    color="green" sub={`${sys.partners_error ?? 0} errors`} />
          </div>
          <p className="text-xs text-gray-600 mt-2">Last heartbeat: {sys.last_heartbeat ? new Date(sys.last_heartbeat).toLocaleString("en-AU") : "—"}</p>
        </div>
      )}
      {bridge && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Bridge Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(bridge).map(([k, v]) => (
              <div key={k} className="glass p-3 rounded border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">{k.replace(/_/g, " ")}</p>
                <p className="font-semibold">{String(v ?? "—")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading from bridge...</div>;
}
function Empty({ msg }: { msg: string }) {
  return <div className="flex items-center justify-center h-40 text-gray-600 text-sm">{msg}</div>;
}

const Finance = () => {
  const [tab, setTab] = useState<TabKey>("maat");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="text-muted-foreground mt-1">MAAT · PAYE · Products · System Health — live Supabase views</p>
      </div>

      <div className="flex gap-1 border-b border-gray-800 pb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "maat"     && <MAATTab />}
        {tab === "paye"     && <PAYETab />}
        {tab === "products" && <ProductsTab />}
        {tab === "health"   && <HealthTab />}
      </div>
    </div>
  );
};

export default Finance;
