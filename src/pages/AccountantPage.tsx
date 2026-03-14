import { useState, useEffect, useCallback } from "react";

const BRIDGE_URL = "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";
const BRIDGE_KEY = "bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4";

const WAVE1_SLUGS = [
  "t4h-financial-position",
  "acct.annual.financial_stmts",
  "acct.annual.trial_balance",
  "maat.api.director_loan",
  "t4h-div7a-fy26-repayment",
  "t4h-bas-fy25-lodgement",
  "t4h-rdti-fy25-lodgement",
  "t4h-director-consulting-invoices",
  "maat.api.tax_position",
  "maat.rd_summary_corrected",
  "rd.ondemand.contemporaneous_pack",
];

const WAVE1_LABELS: Record<string, string> = {
  "t4h-financial-position": "T4H Financial Position",
  "acct.annual.financial_stmts": "Full Year Financial Statements",
  "acct.annual.trial_balance": "Full Year Trial Balance",
  "maat.api.director_loan": "Director Loan Balance (FY)",
  "t4h-div7a-fy26-repayment": "Div 7A — $72K Due 30 Jun 2026",
  "t4h-bas-fy25-lodgement": "BAS FY2025 — 4 Qtrs Outstanding",
  "t4h-rdti-fy25-lodgement": "RDTI FY2025 — 30 Apr Deadline",
  "t4h-director-consulting-invoices": "Director Consulting Invoices",
  "maat.api.tax_position": "Tax Position Summary",
  "maat.rd_summary_corrected": "R&D Summary (Corrected)",
  "rd.ondemand.contemporaneous_pack": "Contemporaneous Records Pack",
};

async function bridge(sql: string) {
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": BRIDGE_KEY },
    body: JSON.stringify({ fn: "troy-sql-executor", sql }),
  });
  const d = await res.json();
  return d.rows || [];
}

async function renderReport(slug: string) {
  const rows = await bridge(`SELECT cmd_render_report('${slug}')`);
  if (!rows.length) return null;
  return rows[0]["cmd_render_report"] || null;
}

function RAGBadge({ rag }: { rag: string }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-900 text-emerald-300 border-emerald-700",
    amber: "bg-yellow-900 text-yellow-300 border-yellow-700",
    red: "bg-red-900 text-red-300 border-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${colors[rag] || colors.amber}`}>
      {rag}
    </span>
  );
}

function DataTable({ data }: { data: Record<string, unknown>[] }) {
  if (!data?.length) return <p className="text-gray-500 text-sm py-4">No data</p>;
  const cols = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800">
            {cols.map((c) => (
              <th key={c} className="text-left px-3 py-2 text-gray-400 font-medium border-b border-gray-700 whitespace-nowrap">
                {c.replace(/_/g, " ").toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-900" : "bg-gray-850"}>
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 text-gray-300 border-b border-gray-800 whitespace-nowrap">
                  {String(row[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <p className="text-gray-500 text-xs py-2 px-3">{data.length - 50} more rows not shown</p>
      )}
    </div>
  );
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data?.length) return;
  const cols = Object.keys(data[0]);
  const rows = data.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [cols.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportPanel({ slug, label }: { slug: string; label: string }) {
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await renderReport(slug);
      if (result?.error) {
        setError(result.error);
      } else if (result?.data) {
        const d = result.data;
        setData(Array.isArray(d) ? d : [d]);
      } else {
        setData([{ note: result?.note || "No data returned" }]);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const toggle = async () => {
    if (!open && !data) await load();
    setOpen((v) => !v);
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={toggle}
      >
        <span className="text-sm font-medium text-white">{label}</span>
        <div className="flex items-center gap-2">
          {data && !error && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (data) downloadCSV(data, `${slug}.csv`);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 border border-blue-800 rounded"
            >
              CSV
            </button>
          )}
          <span className="text-gray-500 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="border-t border-gray-700">
          {loading && <p className="text-gray-400 text-sm px-4 py-3 animate-pulse">Loading...</p>}
          {error && <p className="text-red-400 text-sm px-4 py-3 font-mono">{error}</p>}
          {data && !loading && <DataTable data={data} />}
        </div>
      )}
    </div>
  );
}

function LiveReportsTab() {
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<Record<string, unknown>[] | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);

  useEffect(() => {
    bridge(
      "SELECT slug, name, domain, frequency, rag, source_type FROM rpt_report WHERE (audience @> '[\"accountant\"]' OR audience::text ILIKE '%accountant%') ORDER BY domain, name"
    ).then(setReports).finally(() => setLoading(false));
  }, []);

  const domains = ["all", ...Array.from(new Set(reports.map((r) => String(r.domain))))].sort();

  const filtered = reports.filter((r) => {
    const match =
      String(r.name).toLowerCase().includes(filter.toLowerCase()) ||
      String(r.slug).toLowerCase().includes(filter.toLowerCase());
    const domOk = domainFilter === "all" || r.domain === domainFilter;
    return match && domOk;
  });

  const selectReport = async (slug: string) => {
    if (activeSlug === slug) {
      setActiveSlug(null);
      return;
    }
    setActiveSlug(slug);
    setActiveData(null);
    setActiveError(null);
    setActiveLoading(true);
    try {
      const result = await renderReport(slug);
      if (result?.error) setActiveError(result.error);
      else if (result?.data) {
        const d = result.data;
        setActiveData(Array.isArray(d) ? d : [d]);
      } else {
        setActiveData([{ note: result?.note || "No data" }]);
      }
    } catch (e) {
      setActiveError(String(e));
    } finally {
      setActiveLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Left: report list */}
      <div className="col-span-1 flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search reports..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                domainFilter === d
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 space-y-1">
          {loading && <p className="text-gray-500 text-sm animate-pulse">Loading...</p>}
          {filtered.map((r) => (
            <div
              key={String(r.slug)}
              onClick={() => selectReport(String(r.slug))}
              className={`px-3 py-2 rounded cursor-pointer border transition-colors ${
                activeSlug === r.slug
                  ? "bg-blue-900 border-blue-600"
                  : "border-transparent hover:bg-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{String(r.name)}</span>
                <RAGBadge rag={String(r.rag)} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{String(r.domain)} · {String(r.frequency)}</p>
            </div>
          ))}
          {!loading && !filtered.length && (
            <p className="text-gray-500 text-sm py-4 text-center">No reports match filter</p>
          )}
        </div>
        <p className="text-gray-600 text-xs">{filtered.length} reports</p>
      </div>

      {/* Right: report viewer */}
      <div className="col-span-2 bg-gray-900 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
        {!activeSlug && (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Select a report to view
          </div>
        )}
        {activeSlug && (
          <>
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {reports.find((r) => r.slug === activeSlug)?.name as string || activeSlug}
              </span>
              {activeData && (
                <button
                  onClick={() => activeData && downloadCSV(activeData, `${activeSlug}.csv`)}
                  className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1 border border-blue-800 rounded"
                >
                  Export CSV
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              {activeLoading && (
                <p className="text-gray-400 text-sm px-4 py-4 animate-pulse">Fetching...</p>
              )}
              {activeError && (
                <p className="text-red-400 text-sm px-4 py-4 font-mono">{activeError}</p>
              )}
              {activeData && !activeLoading && <DataTable data={activeData} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Wave1Tab() {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const generatePack = async () => {
    setGenerating(true);
    const newStatus: Record<string, string> = {};
    for (const slug of WAVE1_SLUGS) {
      newStatus[slug] = "loading";
      setStatus({ ...newStatus });
      try {
        const result = await renderReport(slug);
        newStatus[slug] = result?.error ? "error" : "ok";
      } catch {
        newStatus[slug] = "error";
      }
      setStatus({ ...newStatus });
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div>
          <h3 className="text-white font-medium">Wave 1 Pack — Gordon McKirdy</h3>
          <p className="text-gray-400 text-sm mt-1">
            Hales Redden & Partners · 11 priority documents · Action required
          </p>
        </div>
        <button
          onClick={generatePack}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-medium text-sm transition-colors"
        >
          {generating ? "Generating..." : "Generate Pack"}
        </button>
      </div>

      <div className="space-y-2">
        {WAVE1_SLUGS.map((slug, i) => {
          const s = status[slug];
          return (
            <div key={slug} className="border border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-gray-600 text-xs font-mono w-5 text-right">{i + 1}</span>
                <span className="flex-1 text-sm text-white">{WAVE1_LABELS[slug]}</span>
                <span className="text-xs text-gray-500 font-mono">{slug}</span>
                <span className={`text-xs font-mono w-16 text-right ${
                  s === "ok" ? "text-emerald-400" :
                  s === "error" ? "text-red-400" :
                  s === "loading" ? "text-yellow-400 animate-pulse" :
                  "text-gray-600"
                }`}>
                  {s === "ok" ? "✓ ready" : s === "error" ? "✗ error" : s === "loading" ? "..." : "pending"}
                </span>
              </div>
              {s === "ok" && (
                <div className="px-4 pb-3">
                  <ReportPanel slug={slug} label={WAVE1_LABELS[slug]} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 text-sm text-gray-400">
        <p className="font-medium text-white mb-2">Send pack to Gordon</p>
        <p>gordon@halesredden.com.au — attach CSV exports from each report, or share CC access link.</p>
        <p className="mt-2 text-yellow-400">
          ⚠ Manual items: Director Consulting Invoices ($308,760), Super Payment Confirmations — not DB-backed, attach from files.
        </p>
      </div>
    </div>
  );
}

export default function AccountantPage() {
  const [tab, setTab] = useState<"wave1" | "live">("wave1");
  const [deadlines, setDeadlines] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    bridge("SELECT * FROM v_maat_api_deadlines ORDER BY due_date LIMIT 5").then(setDeadlines);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white p-4 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Accountant Pack</h1>
          <p className="text-gray-400 text-sm">Gordon McKirdy · Hales Redden & Partners</p>
        </div>
        <div className="flex gap-4">
          {deadlines.slice(0, 3).map((d, i) => (
            <div key={i} className="text-right">
              <p className="text-xs text-red-400 font-medium">{String(d.deadline_name || d.name || "")}</p>
              <p className="text-xs text-gray-500">{String(d.due_date || "")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 w-fit">
        {(["wave1", "live"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === t ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "wave1" ? "Wave 1 Pack (11)" : "Live Reports"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "wave1" && (
          <div className="h-full overflow-y-auto pr-1">
            <Wave1Tab />
          </div>
        )}
        {tab === "live" && <LiveReportsTab />}
      </div>
    </div>
  );
}
