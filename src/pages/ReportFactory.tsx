import { useState, useEffect, useCallback } from "react";

const BASE = "";
const INT_TOKEN = import.meta.env.VITE_INTERNAL_API_TOKEN || 'rpt-int-t4h-2026';

type Rag = "green" | "amber" | "red";
type ReportStatus = "live" | "draft" | "broken" | "legacy" | "retired";

interface Report {
  slug: string;
  name: string;
  domain: string;
  frequency: string;
  tier: number;
  status: ReportStatus;
  rag: Rag;
  source_ref: string;
  known_issues?: string;
  notes?: string;
}

interface Pack {
  slug: string;
  name: string;
  kind: string;
  frequency: string;
  status: string;
  notes?: string;
}

interface RunResult {
  slug: string;
  name?: string;
  status: string;
  rag: Rag;
  row_count: number;
  data?: any[];
  checks?: any[];
  error?: string;
  message?: string;
  generated_at?: string;
}

interface PackResult {
  pack_slug: string;
  pack_name: string;
  kind: string;
  rag: Rag;
  readiness_pct: number;
  total_reports: number;
  green_count: number;
  fail_count: number;
  reports: any[];
  generated_at?: string;
  error?: string;
}

const RAG_COLOR: Record<Rag, string> = {
  green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  red: "bg-red-500/20 text-red-300 border-red-500/30",
};
const RAG_DOT: Record<Rag, string> = {
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
};

const DOMAIN_LABELS: Record<string, string> = {
  finance: "Finance", tax: "Tax", rd: "R&D", evidence: "Evidence",
  governance: "Governance", ops: "Ops", security: "Security",
};

function RagBadge({ rag }: { rag: Rag }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${RAG_COLOR[rag]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${RAG_DOT[rag]}`} />
      {rag.toUpperCase()}
    </span>
  );
}

function Spinner() {
  return <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

function RunModal({ result, onClose }: { result: RunResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="font-semibold text-white">{result.name || result.slug}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{result.slug}</p>
          </div>
          <div className="flex items-center gap-3">
            <RagBadge rag={result.rag} />
            <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {result.message && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-300 text-sm">{result.message}</div>
          )}
          {result.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm">{result.error}</div>
          )}
          {result.checks && result.checks.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Checks ({result.checks.length})</h4>
              <div className="space-y-1">
                {result.checks.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white/5 rounded px-3 py-2">
                    <span className="text-gray-300">{c.name || c.code}</span>
                    <span className={c.passed ? "text-emerald-400" : "text-red-400"}>
                      {c.passed === null ? "?" : c.passed ? "PASS" : `FAIL (${c.issue_count ?? "?"})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
              Data — {result.row_count ?? 0} rows
            </h4>
            {result.data && result.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-300">
                  <thead>
                    <tr className="border-b border-white/10">
                      {Object.keys(result.data[0]).map(k => (
                        <th key={k} className="text-left py-1 pr-3 text-gray-500 font-normal whitespace-nowrap">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.slice(0, 20).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        {Object.values(row).map((v: any, j: number) => (
                          <td key={j} className="py-1 pr-3 whitespace-nowrap max-w-[200px] truncate">
                            {v === null ? <span className="text-gray-600">null</span> : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.data.length > 20 && (
                  <p className="text-gray-500 text-xs mt-2">Showing 20 of {result.data.length} rows</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">No data returned</p>
            )}
          </div>
          {result.generated_at && (
            <p className="text-xs text-gray-600">Generated: {new Date(result.generated_at).toLocaleString("en-AU")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PackModal({ result, onClose }: { result: PackResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="font-semibold text-white">{result.pack_name}</h3>
            <p className="text-xs text-gray-400">{result.pack_slug} · {result.kind}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{result.readiness_pct}%</span>
            <RagBadge rag={result.rag} />
            <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex gap-4 text-xs text-gray-400 mb-3">
            <span>Total: {result.total_reports}</span>
            <span className="text-emerald-400">Green: {result.green_count}</span>
            <span className="text-red-400">Issues: {result.fail_count}</span>
          </div>
          {result.reports?.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400 text-xs w-4 shrink-0">{r.run_order}</span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate">{r.name || r.report_slug}</p>
                  {(r.error || r.message) && (
                    <p className="text-xs text-amber-400 truncate">{r.error || r.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-gray-500">{r.row_count} rows</span>
                <RagBadge rag={r.rag} />
              </div>
            </div>
          ))}
          {result.generated_at && (
            <p className="text-xs text-gray-600 mt-2">Generated: {new Date(result.generated_at).toLocaleString("en-AU")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportFactory() {
  const [reports, setReports] = useState<Report[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningSlug, setRunningSlug] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [packResult, setPackResult] = useState<PackResult | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"reports" | "packs">("packs");

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BASE}/api/rpt/registry`;
      const params: string[] = [];
      if (domainFilter !== "all") params.push(`domain=${domainFilter}`);
      if (tierFilter !== "all") params.push(`tier=${tierFilter}`);
      if (statusFilter !== "all") params.push(`status=${statusFilter}`);
      if (params.length) url += "?" + params.join("&");
      const r = await fetch(url);
      const d = await r.json();
      setReports(d.reports || []);
      setPacks(d.packs || []);
      setSummary(d.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [domainFilter, tierFilter, statusFilter]);

  useEffect(() => { loadRegistry(); }, [loadRegistry]);

  const runReport = async (slug: string) => {
    setRunningSlug(slug);
    try {
      const r = await fetch(`${BASE}/api/rpt/report?slug=${encodeURIComponent(slug)}`, { headers: { 'x-internal-token': INT_TOKEN } });
      const d = await r.json();
      setRunResult(d);
    } catch (e: any) {
      setRunResult({ slug, status: "failed", rag: "red", row_count: 0, error: e.message });
    } finally {
      setRunningSlug(null);
    }
  };

  const runPack = async (slug: string) => {
    setRunningSlug(slug);
    try {
      const r = await fetch(`${BASE}/api/rpt/pack?slug=${encodeURIComponent(slug)}`, { headers: { 'x-internal-token': INT_TOKEN } });
      const d = await r.json();
      setPackResult(d);
    } catch (e: any) {
      setPackResult({ pack_slug: slug, pack_name: slug, kind: "", rag: "red", readiness_pct: 0, total_reports: 0, green_count: 0, fail_count: 0, reports: [], error: e.message });
    } finally {
      setRunningSlug(null);
    }
  };

  const filteredReports = reports.filter(r => {
    if (search && !r.slug.includes(search.toLowerCase()) && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const domains = [...new Set(reports.map(r => r.domain))].sort();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {runResult && <RunModal result={runResult} onClose={() => setRunResult(null)} />}
      {packResult && <PackModal result={packResult} onClose={() => setPackResult(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Report Factory</h1>
          <p className="text-gray-400 text-sm mt-1">One-click regeneration from canonical MAAT data</p>
        </div>
        <button onClick={loadRegistry} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
          {loading ? <Spinner /> : "↻"} Refresh Registry
        </button>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">{summary.total_reports}</p>
            <p className="text-xs text-gray-400 mt-1">Reports</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">{summary.total_packs}</p>
            <p className="text-xs text-gray-400 mt-1">Packs</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">{summary.total_checks}</p>
            <p className="text-xs text-gray-400 mt-1">Checks</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-400">{summary.rag?.green || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Green</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">{summary.rag?.amber || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Amber</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{summary.rag?.red || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Red</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">
              {summary.total_reports > 0 ? Math.round(100 * (summary.rag?.green || 0) / summary.total_reports) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Green rate</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white/5 rounded-lg p-1 w-fit">
        {(["packs", "reports"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
              ${activeTab === tab ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"}`}>
            {tab} {tab === "packs" ? `(${packs.length})` : `(${filteredReports.length})`}
          </button>
        ))}
      </div>

      {/* Packs tab */}
      {activeTab === "packs" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {packs.map(pack => (
            <div key={pack.slug} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-white text-sm leading-tight">{pack.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{pack.slug}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  pack.status === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>{pack.kind}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{pack.frequency}</span>
              </div>
              {pack.notes && <p className="text-xs text-gray-500 line-clamp-2">{pack.notes}</p>}
              <button
                onClick={() => runPack(pack.slug)}
                disabled={runningSlug === pack.slug}
                className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {runningSlug === pack.slug ? <><Spinner /> Generating…</> : "▶ Generate Pack"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reports tab */}
      {activeTab === "reports" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text" placeholder="Search reports…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 w-56"
            />
            <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white">
              <option value="all">All domains</option>
              {domains.map(d => <option key={d} value={d}>{DOMAIN_LABELS[d] || d}</option>)}
            </select>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white">
              <option value="all">All tiers</option>
              <option value="0">Tier 0 — Critical</option>
              <option value="1">Tier 1 — Core</option>
              <option value="2">Tier 2 — Supporting</option>
              <option value="3">Tier 3 — Legacy</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white">
              <option value="all">All status</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="broken">Broken</option>
            </select>
          </div>

          {/* Report list */}
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <Spinner /> <span className="ml-2">Loading registry…</span>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-400">
                    <th className="text-left py-3 px-4 font-medium">Report</th>
                    <th className="text-left py-3 px-3 font-medium hidden sm:table-cell">Domain</th>
                    <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Freq</th>
                    <th className="text-left py-3 px-3 font-medium hidden lg:table-cell">Source</th>
                    <th className="text-left py-3 px-3 font-medium">RAG</th>
                    <th className="text-right py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r, i) => (
                    <tr key={r.slug} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                      <td className="py-2.5 px-4">
                        <div>
                          <p className="text-gray-200 font-medium text-sm leading-tight">{r.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{r.slug}</p>
                          {r.known_issues && <p className="text-xs text-amber-400 mt-0.5 truncate max-w-xs">{r.known_issues}</p>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 hidden sm:table-cell">
                        <span className="text-xs bg-white/10 rounded px-2 py-0.5 text-gray-300">{DOMAIN_LABELS[r.domain] || r.domain}</span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-gray-400 hidden md:table-cell capitalize">{r.frequency}</td>
                      <td className="py-2.5 px-3 hidden lg:table-cell">
                        <code className="text-xs text-gray-500 bg-white/5 rounded px-1.5 py-0.5 max-w-[180px] truncate block">{r.source_ref}</code>
                      </td>
                      <td className="py-2.5 px-3"><RagBadge rag={r.rag} /></td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => runReport(r.slug)}
                          disabled={runningSlug === r.slug}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                            ${r.status === 'live'
                              ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                              : 'bg-white/10 hover:bg-white/15 text-gray-300'}`}
                        >
                          {runningSlug === r.slug ? <Spinner /> : r.status === 'live' ? '▶' : '○'}
                          {runningSlug === r.slug ? 'Running' : r.status === 'live' ? 'Refresh' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReports.length === 0 && (
                <div className="py-12 text-center text-gray-500">No reports match filters</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
