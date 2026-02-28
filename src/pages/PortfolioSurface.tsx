import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { RefreshCw, ExternalLink, Save, CheckCircle, XCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface SurfaceRow {
  business_slug: string;
  business_name: string;
  group_code: string;
  sort_order: number;
  include: boolean;
  validation_state: string;
  public_url_canonical: string | null;
  vercel_project: string | null;
  github_repo: string | null;
}

type DirtyMap = Record<string, Partial<SurfaceRow>>;

// ── Constants ──────────────────────────────────────────────────────────────
const GROUP_COLORS: Record<string, string> = {
  G1: "text-indigo-400 bg-indigo-900/30 border-indigo-700/50",
  G2: "text-emerald-400 bg-emerald-900/30 border-emerald-700/50",
  G3: "text-red-400 bg-red-900/30 border-red-700/50",
  G4: "text-amber-400 bg-amber-900/30 border-amber-700/50",
  G5: "text-purple-400 bg-purple-900/30 border-purple-700/50",
  G6: "text-sky-400 bg-sky-900/30 border-sky-700/50",
  G7: "text-green-400 bg-green-900/30 border-green-700/50",
};

const SQL_LOAD = `
  SELECT business_slug, business_name, group_code, sort_order, include,
         validation_state, public_url_canonical, vercel_project, github_repo
  FROM inventory.v_t4h_portfolio_surface
  ORDER BY sort_order ASC
`;

// ── Component ──────────────────────────────────────────────────────────────
const PortfolioSurface = () => {
  const [rows, setRows] = useState<SurfaceRow[]>([]);
  const [dirty, setDirtyMap] = useState<DirtyMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ── Load ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bridgeSQL(SQL_LOAD);
      const rawRows = res.rows;
      setRows(Array.isArray(rawRows) ? rawRows as SurfaceRow[] : []);
      setDirtyMap({});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Dirty tracking ───────────────────────────────────────────────────────
  const markDirty = (slug: string, field: keyof SurfaceRow, value: any) => {
    setDirtyMap(prev => ({
      ...prev,
      [slug]: { ...(prev[slug] || {}), [field]: value },
    }));
  };

  const getCurrent = (r: SurfaceRow): SurfaceRow => ({
    ...r,
    ...(dirty[r.business_slug] || {}),
  });

  const dirtyCount = Object.keys(dirty).length;

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!dirtyCount) return;
    setSaving(true);
    let ok = 0, fail = 0;

    for (const [slug, changes] of Object.entries(dirty)) {
      const sets: string[] = [];
      if ("sort_order" in changes) sets.push(`sort_order = ${changes.sort_order}`);
      if ("include" in changes) sets.push(`include = ${changes.include}`);
      if ("validation_state" in changes) {
        sets.push(`validation_state = '${changes.validation_state}'`);
        if (changes.validation_state === "VERIFIED") sets.push(`last_validated_at = now()`);
      }
      if (!sets.length) continue;

      try {
        await bridgeSQL(
          `UPDATE inventory.t4h_portfolio_surface SET ${sets.join(", ")} WHERE business_key = '${slug}'`
        );
        ok++;
      } catch (e: any) {
        console.error("Save failed for", slug, e.message);
        fail++;
      }
    }

    setSaving(false);
    showToast(
      fail > 0 ? `${ok} saved, ${fail} failed` : `${ok} row${ok !== 1 ? "s" : ""} saved`,
      fail === 0
    );
    await load();
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const safeRows = Array.isArray(rows) ? rows : [];
  const filtered = safeRows.filter(r => {
    const cur = getCurrent(r);
    if (groupFilter !== "ALL" && cur.group_code !== groupFilter) return false;
    if (stateFilter && cur.validation_state !== stateFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${r.business_name} ${r.business_slug} ${r.public_url_canonical ?? ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Group dividers ────────────────────────────────────────────────────────
  type TableItem = { type: "divider"; group: string } | { type: "row"; row: SurfaceRow };
  const tableItems: TableItem[] = [];
  let lastGroup = "";
  for (const row of filtered) {
    const cur = getCurrent(row);
    if (cur.group_code !== lastGroup) {
      tableItems.push({ type: "divider", group: cur.group_code });
      lastGroup = cur.group_code;
    }
    tableItems.push({ type: "row", row });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Surface</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">inventory.v_t4h_portfolio_surface → t4h_portfolio_surface</p>
        </div>
        <div className="flex items-center gap-3">
          {dirtyCount > 0 && (
            <span className="text-xs font-mono bg-amber-900/40 text-amber-400 border border-amber-700/50 px-3 py-1 rounded-full">
              {dirtyCount} unsaved
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={save}
            disabled={!dirtyCount || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["ALL", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].map(g => (
          <button
            key={g}
            onClick={() => setGroupFilter(g === groupFilter ? "ALL" : g)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold border transition ${
              groupFilter === g
                ? "bg-blue-600 border-blue-500 text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            {g}
          </button>
        ))}
        <div className="h-4 w-px bg-slate-700 mx-1" />
        {["VERIFIED", "UNVERIFIED"].map(s => (
          <button
            key={s}
            onClick={() => setStateFilter(stateFilter === s ? null : s)}
            className={`px-3 py-1 rounded-md text-xs font-mono border transition ${
              stateFilter === s
                ? s === "VERIFIED"
                  ? "bg-emerald-900/60 border-emerald-600 text-emerald-300"
                  : "bg-slate-700 border-slate-500 text-slate-200"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto">
          <input
            type="text"
            placeholder="Search name, slug, url..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-500 w-56"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No results</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-12">Grp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">URL</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">State</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Incl</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell w-24">Links</th>
                </tr>
              </thead>
              <tbody>
                {tableItems.map((item, i) => {
                  if (item.type === "divider") {
                    return (
                      <tr key={`div-${item.group}`} className="border-b border-slate-700/50">
                        <td colSpan={7} className="px-4 py-2 text-xs font-mono font-bold text-slate-500 tracking-widest uppercase bg-slate-900/30">
                          ── {item.group} ──
                        </td>
                      </tr>
                    );
                  }

                  const { row } = item;
                  const cur = getCurrent(row);
                  const isDirty = !!dirty[row.business_slug];
                  const gStyle = GROUP_COLORS[cur.group_code] || "text-slate-400 bg-slate-800 border-slate-600";
                  const nextState = cur.validation_state === "VERIFIED" ? "UNVERIFIED" : "VERIFIED";

                  return (
                    <tr
                      key={row.business_slug}
                      className={`border-b border-slate-700/50 transition-colors ${
                        isDirty ? "bg-amber-900/10" : "hover:bg-slate-700/20"
                      }`}
                    >
                      {/* sort_order */}
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={cur.sort_order}
                          onChange={e => markDirty(row.business_slug, "sort_order", +e.target.value)}
                          className="w-16 bg-transparent border border-transparent hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800 rounded px-2 py-1 text-right font-mono text-xs text-slate-300 outline-none transition"
                        />
                      </td>

                      {/* group */}
                      <td className="px-4 py-2">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${gStyle}`}>
                          {cur.group_code}
                        </span>
                      </td>

                      {/* name + slug */}
                      <td className="px-4 py-2">
                        <div className="font-medium text-slate-200">{row.business_name}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">{row.business_slug}</div>
                      </td>

                      {/* url */}
                      <td className="px-4 py-2 hidden md:table-cell">
                        {row.public_url_canonical ? (
                          <a
                            href={`https://${row.public_url_canonical}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-slate-500 hover:text-blue-400 flex items-center gap-1 transition max-w-[180px] truncate"
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            {row.public_url_canonical}
                          </a>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>

                      {/* validation_state — click to toggle */}
                      <td className="px-4 py-2">
                        <button
                          onClick={() => markDirty(row.business_slug, "validation_state", nextState)}
                          className={`text-xs font-mono px-2.5 py-1 rounded-full border transition cursor-pointer ${
                            cur.validation_state === "VERIFIED"
                              ? "bg-emerald-900/40 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/70"
                              : "bg-slate-800 border-slate-600 text-slate-500 hover:border-slate-400 hover:text-slate-300"
                          }`}
                          title="Click to toggle"
                        >
                          {cur.validation_state}
                        </button>
                      </td>

                      {/* include toggle */}
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => markDirty(row.business_slug, "include", !cur.include)}
                          className="transition"
                          title={cur.include ? "Click to exclude" : "Click to include"}
                        >
                          {cur.include
                            ? <CheckCircle className="w-5 h-5 text-blue-400 hover:text-blue-300" />
                            : <XCircle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                          }
                        </button>
                      </td>

                      {/* links */}
                      <td className="px-4 py-2 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {row.vercel_project && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" title={`Vercel: ${row.vercel_project}`} />
                          )}
                          {row.github_repo && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title={`GitHub: ${row.github_repo}`} />
                          )}
                          {!row.vercel_project && !row.github_repo && (
                            <span className="text-slate-700 text-xs font-mono">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="text-xs text-slate-600 font-mono text-right">
        {filtered.length} / {safeRows.length} businesses
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 ${
          toast.ok ? "bg-emerald-900 border border-emerald-600 text-emerald-300" : "bg-red-900 border border-red-600 text-red-300"
        }`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default PortfolioSurface;
