import { useEffect, useState } from "react";
import { bridgeSQL as bridge } from "@/lib/bridge";

interface SqlTip {
  id: number;
  tip_key: string;
  description: string;
  sql_query: string;
  context: string;
  pillar: string;
  tags: string[];
}

const PILLAR_COLORS: Record<string, string> = {
  "01_mcp": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "02_jobs": "text-green-400 bg-green-400/10 border-green-400/30",
  "03_business": "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "04_research": "text-purple-400 bg-purple-400/10 border-purple-400/30",
  "05_personal": "text-pink-400 bg-pink-400/10 border-pink-400/30",
};

const SQLQueries = () => {
  const [tips, setTips] = useState<SqlTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState<string>("all");

  useEffect(() => {
    bridge("SELECT id, tip_key, description, sql_query, context, pillar, tags FROM sql_tips ORDER BY pillar, tip_key")
      .then((rows) => { setTips(rows); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const copy = (id: number, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const pillars = ["all", ...Array.from(new Set(tips.map(t => t.pillar).filter(Boolean)))];

  const filtered = tips.filter(t => {
    const matchSearch = !search ||
      t.tip_key?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.sql_query?.toLowerCase().includes(search.toLowerCase());
    const matchPillar = pillarFilter === "all" || t.pillar === pillarFilter;
    return matchSearch && matchPillar;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading SQL queries from bridge...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-destructive">Bridge error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Common Project SQL Queries</h1>
          <p className="text-muted-foreground mt-1">{tips.length} queries · sql_tips table · live via bridge</p>
        </div>
        <input
          type="text"
          placeholder="Search queries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary w-64"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {pillars.map(p => (
          <button
            key={p}
            onClick={() => setPillarFilter(p)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              pillarFilter === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {p === "all" ? "All pillars" : p}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          {tips.length === 0 ? "No SQL tips found in database." : "No matches."}
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((tip) => (
          <div key={tip.id} className="glass p-6 rounded-lg border border-border hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold font-mono">{tip.tip_key}</h3>
                  {tip.pillar && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PILLAR_COLORS[tip.pillar] ?? "text-muted-foreground bg-muted border-border"}`}>
                      {tip.pillar}
                    </span>
                  )}
                </div>
                {tip.description && <p className="text-sm text-muted-foreground">{tip.description}</p>}
                {tip.context && <p className="text-xs text-muted-foreground/70 mt-1">{tip.context}</p>}
              </div>
              <button
                onClick={() => copy(tip.id, tip.sql_query)}
                className="shrink-0 px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded transition-colors"
              >
                {copied === tip.id ? "✓ Copied" : "Copy SQL"}
              </button>
            </div>
            <pre className="bg-black/40 border border-border rounded p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
              {tip.sql_query}
            </pre>
            {Array.isArray(tip.tags) && tip.tags.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {tip.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SQLQueries;
