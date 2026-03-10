import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";

// ── Helpers ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, loading }: { label: string; value: any; loading: boolean }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-2xl font-bold text-white">
      {loading ? <span className="animate-pulse text-slate-600">—</span> : String(value ?? "—")}
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/40">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const DataTable = ({ rows, loading, cols, renderHead, renderRow }: {
  rows: any[]; loading: boolean; cols: string[];
  renderHead: () => React.ReactNode;
  renderRow: (row: any, i: number) => React.ReactNode;
}) => (
  loading ? (
    <div className="flex items-center justify-center h-32 text-slate-500 text-sm animate-pulse">Loading…</div>
  ) : !rows?.length ? (
    <div className="flex items-center justify-center h-20 text-slate-600 text-sm">No data</div>
  ) : (
    <table className="w-full text-sm">
      <thead className="bg-slate-900/50">{renderHead()}</thead>
      <tbody>{rows.map((row, i) => renderRow(row, i))}</tbody>
    </table>
  )
);

// ── Page ───────────────────────────────────────────────────────────────────
const PAGE_ID = "maat";

const MAATPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({}); 
  const [data, setData] = useState<Record<string, any[]>>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const kpiKeys = ["maat_txn_count", "maat_evidence_count", "maat_rules_count", "maat_cum_loss"];
      const tableKeys = ["maat_pl_master", "maat_monthly_pl", "maat_rdti", "maat_gst", "maat_deadlines", "maat_vendors", "maat_rpt_pack_readiness"];
      const [kpiResults, tableResults] = await Promise.all([
        Promise.all(kpiKeys.map(k => bridgeQueryKey(PAGE_ID, k))),
        Promise.all(tableKeys.map(k => bridgeQueryKey(PAGE_ID, k))),
      ]);
      const newKpis: Record<string, any> = {};
      kpiKeys.forEach((k, i) => { newKpis[k] = kpiResults[i]?.rows?.[0]?.value ?? kpiResults[i]?.rows?.[0] ?? "—"; });
      const newData: Record<string, any[]> = {};
      tableKeys.forEach((k, i) => { newData[k] = tableResults[i]?.rows ?? []; });
      setKpis(newKpis); setData(newData);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MAAT</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">{PAGE_ID} · live from bridge</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-50">
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Transactions" value={kpis["maat_txn_count"]} loading={loading} />
      <StatCard label="Evidence Items" value={kpis["maat_evidence_count"]} loading={loading} />
      <StatCard label="Classification Rules" value={kpis["maat_rules_count"]} loading={loading} />
      <StatCard label="Cumulative Loss" value={kpis["maat_cum_loss"]} loading={loading} />
      </div>
      {/* Tables */}
      <div className="space-y-4">
      <Section title="P&L Master by FY">
        <DataTable rows={data["maat_pl_master"]} loading={loading} cols={["fy","revenue","total_expense","net_loss","rdti_refund"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">fy</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">revenue</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">total_expense</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">net_loss</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">rdti_refund</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["fy"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["revenue"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["total_expense"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["net_loss"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["rdti_refund"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Monthly P&L">
        <DataTable rows={data["maat_monthly_pl"]} loading={loading} cols={["month","entity","income","expenses","net"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">month</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">entity</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">income</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">expenses</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">net</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["month"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["entity"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["income"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["expenses"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["net"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="RDTI by FY">
        <DataTable rows={data["maat_rdti"]} loading={loading} cols={["fy","rd_spend","rdti_refund","refund_rate"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">fy</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">rd_spend</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">rdti_refund</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">refund_rate</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["fy"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["rd_spend"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["rdti_refund"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["refund_rate"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="GST Summary">
        <DataTable rows={data["maat_gst"]} loading={loading} cols={["period","gst_collected","gst_paid","net_gst","status"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">period</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">gst_collected</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">gst_paid</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">net_gst</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["period"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["gst_collected"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["gst_paid"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["net_gst"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Upcoming Deadlines">
        <DataTable rows={data["maat_deadlines"]} loading={loading} cols={["deadline_type","due_date","entity","status","amount"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">deadline_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">due_date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">entity</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">amount</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["deadline_type"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["due_date"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["entity"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["status"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["amount"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Top Unclassified Vendors">
        <DataTable rows={data["maat_vendors"]} loading={loading} cols={["vendor","transaction_count","total_amount","category"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">vendor</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">transaction_count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">total_amount</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">category</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["vendor"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["transaction_count"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["total_amount"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["category"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      <Section title="Pack Readiness">
        <DataTable rows={data["maat_rpt_pack_readiness"]} loading={loading} cols={["pack_name","total_items","live_items","readiness_pct"]}
          renderHead={()=>(
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">pack_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">total_items</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">live_items</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">readiness_pct</th></tr>
          )}
          renderRow={(row, i)=>(
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["pack_name"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["total_items"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["live_items"] ?? "—")}</td><td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate">{String(row["readiness_pct"] ?? "—")}</td>
            </tr>
          )}
        />
      </Section>
      </div>
    </div>
  );
};

export default MAATPage;
