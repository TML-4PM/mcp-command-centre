import { useEffect, useState } from "react";

const BRIDGE = "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";

interface SqlTip {
  id: number;
  title: string;
  description: string;
  sql: string;
  tags: string[];
}

async function bridge(sql: string) {
  const res = await fetch(BRIDGE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ functionName: "troy-sql-executor", payload: { sql } }),
  });
  const data = await res.json();
  const body = typeof data.result?.body === "string" ? JSON.parse(data.result.body) : data.result?.body;
  return body?.rows ?? [];
}

const SQLQueries = () => {
  const [tips, setTips] = useState<SqlTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    bridge("SELECT id, title, description, sql, tags FROM sql_tips ORDER BY title")
      .then((rows) => { setTips(rows); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const copy = (id: number, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = tips.filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.sql?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Loading SQL queries...
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive">
      Bridge error: {error}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Common Project SQL Queries</h1>
          <p className="text-muted-foreground mt-1">{tips.length} queries · sourced from sql_tips table</p>
        </div>
        <input
          type="text"
          placeholder="Search queries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary w-64"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          {tips.length === 0 ? "No SQL tips found in database." : "No matches for your search."}
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((tip) => (
          <div key={tip.id} className="glass p-6 rounded-lg border border-border hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-semibold text-lg">{tip.title || "Untitled"}</h3>
                {tip.description && (
                  <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                )}
              </div>
              <button
                onClick={() => copy(tip.id, tip.sql)}
                className="shrink-0 px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded transition-colors"
              >
                {copied === tip.id ? "✓ Copied" : "Copy SQL"}
              </button>
            </div>
            <pre className="bg-black/40 border border-border rounded p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-words font-mono">
              {tip.sql}
            </pre>
            {Array.isArray(tip.tags) && tip.tags.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {tip.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                    {tag}
                  </span>
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
