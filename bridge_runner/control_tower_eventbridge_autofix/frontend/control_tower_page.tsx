// control_tower_page.tsx — Control Tower dashboard page
import { useEffect, useState } from "react";

interface Site {
  id: string; slug: string; name: string; group_name: string;
  status: string; reality_status: string; health_status: string;
  canonical_url: string; vercel_url: string; github_repo: string;
  open_action_count: number; failed_autofix_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  REAL: "bg-green-100 text-green-800", PARTIAL: "bg-yellow-100 text-yellow-800",
  PRETEND: "bg-red-100 text-red-800", UNKNOWN: "bg-gray-100 text-gray-600"
};

export default function ControlTowerPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [health, setHealth] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/sites?status=LIVE").then(r => r.json()),
      fetch("/api/health").then(r => r.json()),
    ]).then(([s, h]) => { setSites(s); setHealth(h); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading control tower…</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">T4H Control Tower</h1>
      <div className="flex gap-4 mb-6 text-sm">
        {Object.entries(health.by_reality || {}).map(([k, v]) => (
          <span key={k} className={`px-3 py-1 rounded-full font-medium ${STATUS_COLOR[k] || ""}`}>
            {k}: {v as number}
          </span>
        ))}
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
          Violations: {health.open_violations ?? "—"}
        </span>
      </div>
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            {["Slug","Name","Group","Reality","Health","Actions","Links"].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sites.map(s => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-xs">{s.slug}</td>
              <td className="px-4 py-2">{s.name}</td>
              <td className="px-4 py-2 text-gray-500">{s.group_name}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLOR[s.reality_status] || ""}`}>
                  {s.reality_status}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className={`px-2 py-0.5 rounded text-xs ${s.health_status === "UP" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {s.health_status}
                </span>
              </td>
              <td className="px-4 py-2 text-center">
                {s.open_action_count > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">{s.open_action_count} open</span>}
                {s.failed_autofix_count > 0 && <span className="ml-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">{s.failed_autofix_count} failed</span>}
              </td>
              <td className="px-4 py-2 space-x-2">
                {s.canonical_url && <a href={s.canonical_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">site</a>}
                {s.github_repo && <a href={`https://github.com/${s.github_repo}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:underline text-xs">gh</a>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
