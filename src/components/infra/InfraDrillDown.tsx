import { useState, useEffect, useCallback } from 'react';
import { bridgeSQL, bridgeCount } from '@/lib/bridge';

interface Tab { key: string; label: string; }
interface DrillConfig { title: string; icon: string; tabs: Tab[]; }

const DRILL_DOWNS: Record<string, DrillConfig> = {
  lambdas: {
    title: 'Lambda Registry', icon: 'λ',
    tabs: [
      { key: 'infra_lambda_list', label: 'All Lambdas' },
      { key: 'infra_lambda_by_category', label: 'By Category' },
      { key: 'infra_lambda_by_status', label: 'By Status' },
    ],
  },
  s3: {
    title: 'S3 Buckets', icon: '◈',
    tabs: [
      { key: 'infra_s3_list', label: 'All Buckets' },
      { key: 'infra_s3_by_region', label: 'By Region' },
      { key: 'infra_s3_by_use', label: 'By Use' },
    ],
  },
  tools: { title: 'Active Tools', icon: '⚡', tabs: [{ key: 'infra_tools_list', label: 'All Tools' }] },
  partners: { title: 'Partners', icon: '◎', tabs: [{ key: 'infra_partners_list', label: 'All Partners' }] },
  alerts: { title: 'Alert Log', icon: '△', tabs: [{ key: 'infra_alerts_list', label: 'Recent Alerts' }] },
};

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined) return '–';
  if (key === 'total_size_bytes' || key === 'total_bytes') {
    const n = Number(value);
    return n > 1073741824 ? `${(n / 1073741824).toFixed(2)} GB` : `${(n / 1048576).toFixed(1)} MB`;
  }
  if (key.includes('cost') || key === 'cost_hint') return value ? `$${Number(value).toFixed(2)}` : '–';
  if (key === 'active' || key === 'acknowledged') return value ? '✓' : '✗';
  if (key.includes('_at') || key === 'stamp' || key === 'last_audited') {
    if (!value) return '–';
    return new Date(String(value)).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' });
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const colLabel = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

async function fetchDrillDown(queryKey: string): Promise<any[]> {
  const lookup = await bridgeSQL(
    `SELECT sql FROM command_centre_queries WHERE key = '${queryKey}' AND is_active = true LIMIT 1`
  );
  if (!lookup.rows.length) throw new Error(`Query ${queryKey} not found`);
  const result = await bridgeSQL(lookup.rows[0].sql);
  return result.rows;
}

function DataTable({ rows, loading }: { rows?: any[]; loading?: boolean }) {
  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-slate-400 text-sm">Loading…</span>
    </div>
  );
  if (!rows?.length) return <p className="text-slate-500 text-sm py-8 text-center">No data</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto max-h-[60vh]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-slate-700/60">
            {cols.map(c => (
              <th key={c} className="px-3 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider bg-slate-900/95 backdrop-blur">{colLabel(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
              {cols.map(c => (
                <td key={c} className="px-3 py-2 text-slate-300 whitespace-nowrap text-[13px]">{formatCell(c, row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DrillPanel({ config, onClose }: { config: DrillConfig; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const loadTab = useCallback(async (idx: number) => {
    const tab = config.tabs[idx];
    if (data[tab.key]) return;
    setLoading(p => ({ ...p, [tab.key]: true }));
    try {
      const rows = await fetchDrillDown(tab.key);
      setData(p => ({ ...p, [tab.key]: rows }));
    } catch { setData(p => ({ ...p, [tab.key]: [] })); }
    setLoading(p => ({ ...p, [tab.key]: false }));
  }, [config, data]);

  useEffect(() => { loadTab(0); }, []);
  useEffect(() => { loadTab(activeTab); }, [activeTab]);
  const currentTab = config.tabs[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-slate-900 border-l border-slate-700/60 shadow-2xl overflow-hidden flex flex-col" style={{ animation: 'slideInRight 0.25s ease-out' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-cyan-400">{config.icon}</span>
            <h2 className="text-lg font-semibold text-white">{config.title}</h2>
            {data[currentTab?.key] && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{data[currentTab.key].length} rows</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl px-2">✕</button>
        </div>
        {config.tabs.length > 1 && (
          <div className="flex gap-1 px-6 pt-3 border-b border-slate-800">
            {config.tabs.map((tab, i) => (
              <button key={tab.key} onClick={() => setActiveTab(i)}
                className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${i === activeTab ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-auto p-4">
          <DataTable rows={data[currentTab?.key]} loading={loading[currentTab?.key]} />
        </div>
        <div className="px-6 py-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
          <span>Query: {currentTab?.key}</span>
          <span className="font-mono">bridge → troy-sql-executor</span>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

function StatCard({ label, value, subtitle, color, onClick }: { label: string; value: string | number; subtitle: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group text-left bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
      <p className="text-[11px] font-medium text-slate-400 tracking-widest uppercase mb-2">{label}</p>
      <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      <p className="text-[10px] text-transparent group-hover:text-cyan-500/70 transition-colors mt-2">Click to explore →</p>
    </button>
  );
}

export default function InfraDrillDown() {
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [counts, setCounts] = useState({ lambdas: '–', s3: '–', tools: '–', partners: '–', alerts: '–' });

  useEffect(() => {
    const queries: Record<string, string> = {
      lambdas: 'SELECT count(*) as c FROM lambda_registry',
      s3: 'SELECT count(*) as c FROM s3_audit_buckets',
      tools: "SELECT count(*) as c FROM tool_registry WHERE active = true",
      partners: 'SELECT count(*) as c FROM partners',
      alerts: 'SELECT count(*) as c FROM alert_log WHERE acknowledged = false',
    };
    Object.entries(queries).forEach(async ([key, sql]) => {
      try {
        const c = await bridgeCount(sql);
        setCounts(p => ({ ...p, [key]: String(c) }));
      } catch { /* keep dash */ }
    });
  }, []);

  return (
    <>
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Lambdas" value={counts.lambdas} subtitle="Registered" color="text-purple-400" onClick={() => setOpenPanel('lambdas')} />
        <StatCard label="S3 Buckets" value={counts.s3} subtitle="Audited" color="text-green-400" onClick={() => setOpenPanel('s3')} />
        <StatCard label="Active Tools" value={counts.tools} subtitle="In registry" color="text-yellow-400" onClick={() => setOpenPanel('tools')} />
        <StatCard label="Partners" value={counts.partners} subtitle="0 errors" color="text-cyan-400" onClick={() => setOpenPanel('partners')} />
        <StatCard label="Alerts" value={counts.alerts} subtitle="Unacknowledged" color="text-red-400" onClick={() => setOpenPanel('alerts')} />
      </div>
      {openPanel && DRILL_DOWNS[openPanel] && (
        <DrillPanel config={DRILL_DOWNS[openPanel]} onClose={() => setOpenPanel(null)} />
      )}
    </>
  );
}
