import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Loader2, RefreshCw, Search, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STAGE_COLOUR: Record<string, string> = {
  CRITICAL: "bg-red-500/20 text-red-300 border-red-500/40",
  STANDARD: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  VALIDATED: "bg-green-500/20 text-green-300 border-green-500/40",
  DISCOVERED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  DEPRECATED: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};
const CONF_COLOUR: Record<string, string> = {
  Proven: "text-green-400",
  High: "text-emerald-400",
  Medium: "text-amber-400",
  Low: "text-red-400",
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>;
}

function CopyCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-1.5 group max-w-xs">
      <span className="font-mono text-xs text-slate-300 truncate" title={value}>{value}</span>
      <button onClick={copy} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition shrink-0">
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

interface KRow {
  lookup_key: string; name: string; canonical_value: string;
  category: string; stage: string; confidence: string;
  system_surface: string; usage_count: number; last_confirmed: string;
}
interface CatRow { category: string; entries: number; critical: number; high_confidence: number; }
interface UsageRow { lookup_key: string; consumer_type: string; consumer_name: string; event_type: string; happened_at: string; }

export default function Knowledge() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, critical: 0, proven: 0 });
  const [register, setRegister] = useState<KRow[]>([]);
  const [categories, setCategories] = useState<CatRow[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ usage: true });

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [statsRes, regRes, catRes, usageRes] = await Promise.all([
        bridgeSQL("SELECT (SELECT count(*) FROM ops.standard_knowledge_register) as total, (SELECT count(*) FROM ops.standard_knowledge_register WHERE status='Active') as active, (SELECT count(*) FROM ops.standard_knowledge_register WHERE stage='CRITICAL' AND status='Active') as critical, (SELECT count(*) FROM ops.standard_knowledge_register WHERE confidence='Proven' AND status='Active') as proven"),
        bridgeSQL("SELECT lookup_key, name, canonical_value, category, stage, confidence, system_surface, usage_count, last_confirmed FROM ops.v_standard_knowledge_active ORDER BY stage DESC, category, lookup_key"),
        bridgeSQL("SELECT category, count(*) as entries, count(*) filter (where stage='CRITICAL') as critical, count(*) filter (where confidence IN ('Proven','High')) as high_confidence FROM ops.v_standard_knowledge_active GROUP BY category ORDER BY entries DESC"),
        bridgeSQL("SELECT lookup_key, consumer_type, consumer_name, event_type, happened_at FROM ops.standard_knowledge_usage_log ORDER BY happened_at DESC LIMIT 50"),
      ]);
      const s = statsRes.rows[0] || {};
      setStats({ total: Number(s.total)||0, active: Number(s.active)||0, critical: Number(s.critical)||0, proven: Number(s.proven)||0 });
      setRegister(regRes.rows);
      setCategories(catRes.rows);
      setUsage(usageRes.rows);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stages = ["ALL", ...Array.from(new Set(register.map(r => r.stage))).sort()];
  const cats = ["ALL", ...Array.from(new Set(register.map(r => r.category))).sort()];

  const filtered = register.filter(r => {
    if (stageFilter !== "ALL" && r.stage !== stageFilter) return false;
    if (catFilter !== "ALL" && r.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.lookup_key.includes(q) || r.name.toLowerCase().includes(q) ||
        r.canonical_value.toLowerCase().includes(q) || (r.system_surface||"").toLowerCase().includes(q);
    }
    return true;
  });

  const toggle = (k: string) => setCollapsed(p => ({...p, [k]: !p[k]}));

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-3" />
      <span className="text-slate-400">Loading Knowledge Register...</span>
    </div>
  );
  if (error) return (
    <div className="text-center py-20 space-y-4">
      <div className="text-red-400 text-xl">⚠ Knowledge Register</div>
      <div className="text-slate-500 text-sm font-mono">{error}</div>
      <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📚 Knowledge Register</h1>
        <button onClick={load} className="text-slate-400 hover:text-white transition p-2 rounded hover:bg-slate-800">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, colour: "text-white" },
          { label: "Active", value: stats.active, colour: "text-green-400" },
          { label: "CRITICAL", value: stats.critical, colour: "text-red-400" },
          { label: "Proven", value: stats.proven, colour: "text-emerald-400" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-5">
              <div className="text-sm text-slate-400 mb-1">{s.label}</div>
              <div className={`text-3xl font-bold ${s.colour}`}>{s.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggle("cats")}>
            {collapsed["cats"] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
            <CardTitle className="text-lg">By Category</CardTitle>
          </div>
        </CardHeader>
        {!collapsed["cats"] && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {["Category","Entries","CRITICAL","High Confidence"].map(h => (
                      <th key={h} className="text-left p-2 text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((r, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-700/20">
                      <td className="p-2 text-slate-200 font-medium">{r.category}</td>
                      <td className="p-2 text-slate-300">{r.entries}</td>
                      <td className="p-2">{r.critical > 0 ? <span className="text-red-400 font-mono">{r.critical}</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="p-2 text-emerald-400 font-mono">{r.high_confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Register table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-lg shrink-0">Register</CardTitle>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{filtered.length} / {register.length}</span>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
                className="bg-slate-700 border-slate-600 text-sm text-slate-300 rounded px-2 py-1 border">
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="bg-slate-700 border-slate-600 text-sm text-slate-300 rounded px-2 py-1 border">
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-7 w-44 bg-slate-700 border-slate-600 text-sm h-8" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr className="border-b border-slate-700">
                  {["Lookup Key","Name","Canonical Value","Category","Stage","Confidence","Surface","Uses"].map(h => (
                    <th key={h} className="text-left p-2 text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-700/20">
                    <td className="p-2 font-mono text-xs text-blue-300 whitespace-nowrap">{r.lookup_key}</td>
                    <td className="p-2 text-slate-200 whitespace-nowrap">{r.name}</td>
                    <td className="p-2"><CopyCell value={r.canonical_value} /></td>
                    <td className="p-2 text-slate-400 whitespace-nowrap">{r.category}</td>
                    <td className="p-2 whitespace-nowrap"><Badge label={r.stage} cls={STAGE_COLOUR[r.stage] || STAGE_COLOUR.STANDARD} /></td>
                    <td className="p-2 whitespace-nowrap"><span className={`text-xs font-mono ${CONF_COLOUR[r.confidence] || ""}`}>{r.confidence}</span></td>
                    <td className="p-2 text-slate-500 text-xs whitespace-nowrap">{r.system_surface || "—"}</td>
                    <td className="p-2 text-slate-400 text-right font-mono text-xs">{r.usage_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-sm">No entries match filters</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage log */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggle("usage")}>
            {collapsed["usage"] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
            <CardTitle className="text-lg">Resolver Usage Log</CardTitle>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{usage.length} events</span>
          </div>
        </CardHeader>
        {!collapsed["usage"] && (
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="border-b border-slate-700">
                    {["Lookup Key","Consumer","Name","Event","When"].map(h => (
                      <th key={h} className="text-left p-2 text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usage.map((r, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-700/20">
                      <td className="p-2 font-mono text-xs text-blue-300">{r.lookup_key}</td>
                      <td className="p-2 text-slate-400 text-xs">{r.consumer_type}</td>
                      <td className="p-2 text-slate-400 text-xs">{r.consumer_name}</td>
                      <td className="p-2 text-xs"><span className="bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">{r.event_type}</span></td>
                      <td className="p-2 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(r.happened_at).toLocaleString("en-AU", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
