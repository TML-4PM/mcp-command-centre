import { useEffect, useState } from "react";
import { bridgeSQL } from "@/lib/bridge";

const StatusBar = () => {
  const [status, setStatus] = useState<"ok" | "degraded" | "down" | "loading">("loading");
  const [stats, setStats] = useState({ queries: 0, pages: 0, lastCheck: "" });

  useEffect(() => {
    const check = async () => {
      try {
        const r = await bridgeSQL("SELECT (SELECT count(*) FROM command_centre_queries WHERE is_active=true) as q, (SELECT count(*) FROM command_centre_pages WHERE is_active=true) as p");
        setStats({ queries: r.rows[0]?.q || 0, pages: r.rows[0]?.p || 0, lastCheck: new Date().toLocaleTimeString("en-AU") });
        setStatus("ok");
      } catch {
        setStatus("degraded");
        setStats(s => ({ ...s, lastCheck: new Date().toLocaleTimeString("en-AU") }));
      }
    };
    check();
    const i = setInterval(check, 120000);
    return () => clearInterval(i);
  }, []);

  const dot = status === "ok" ? "bg-green-500" : status === "degraded" ? "bg-amber-500" : status === "down" ? "bg-red-500" : "bg-slate-500";

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 px-4 py-1.5 z-50 text-xs text-slate-500 flex items-center justify-between backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${dot} ${status === "loading" ? "animate-pulse" : ""}`} />
          <span className="uppercase tracking-wider">{status === "ok" ? "Bridge Live" : status === "degraded" ? "Degraded" : status === "loading" ? "Connecting..." : "Offline"}</span>
        </div>
        <span className="text-slate-700">|</span>
        <span>{stats.pages} pages</span>
        <span className="text-slate-700">·</span>
        <span>{stats.queries} queries</span>
      </div>
      <div>
        <span>Last check: {stats.lastCheck || "—"}</span>
      </div>
    </footer>
  );
};

export default StatusBar;
