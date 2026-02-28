import { useEffect, useRef, useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const SLUG = "portfolio-surface-admin";

async function fetchSnippet(): Promise<string | null> {
  const url =
    `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/t4h_ui_snippet` +
    `?select=html&slug=eq.${SLUG}&is_active=eq.true&order=updated_at.desc&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Snippet fetch failed: ${res.status}`);
  const json = await res.json();
  return (json?.[0]?.html as string | null) ?? null;
}

function buildSrcDoc(html: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;">
${html}
</body>
</html>`;
}

const PortfolioSurface = () => {
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const html = await fetchSnippet();
      if (!html) throw new Error("Widget not found in Supabase (slug: " + SLUG + ")");
      setSrcDoc(buildSrcDoc(html));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="text-sm font-mono">Loading portfolio surface widget...</div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-red-400 font-mono text-sm">{error}</div>
      <button onClick={load} className="text-xs px-4 py-2 bg-slate-800 rounded border border-slate-600 text-slate-300 hover:bg-slate-700">
        Retry
      </button>
    </div>
  );

  return (
    <div style={{ margin: "-2rem -1.5rem" }}>
      <iframe
        title="portfolio-surface-admin"
        srcDoc={srcDoc!}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        style={{
          width: "100%",
          height: "calc(100vh - 60px)",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
};

export default PortfolioSurface;
