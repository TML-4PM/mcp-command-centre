import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey } from "@/lib/bridge";

const SC = ({ label: l, v, ld }: { label: string; v: any; ld: boolean }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 truncate">{l}</div>
    <div className="text-2xl font-bold text-white font-mono">{ld ? <span className="animate-pulse text-slate-600">—</span> : String(v ?? "—")}</div>
  </div>
);

const Sec = ({ title: t, n, children: c }: { title: string; n?: number; children: React.ReactNode }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-300">{t}</h3>
      {n !== undefined && <span className="text-xs text-slate-500 font-mono">{n} rows</span>}
    </div>
    <div className="overflow-x-auto max-h-80">{c}</div>
  </div>
);

const DT = ({ rows, ld, head, row }: { rows: any[]; ld: boolean; head: () => React.ReactNode; row: (r: any, i: number) => React.ReactNode }) => (
  ld ? <div className="flex items-center justify-center h-24 text-slate-500 text-sm animate-pulse">Loading…</div>
  : !rows?.length ? <div className="flex items-center justify-center h-16 text-slate-600 text-sm">No data</div>
  : <table className="w-full text-sm"><thead>{head()}</thead><tbody>{rows.map((r, i) => row(r, i))}</tbody></table>
);

const MAATPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      await Promise.allSettled([
        bridgeQueryKey("maat_txn_count").then(r => setKpis(p => ({ ...p, "maat_txn_count": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "maat_txn_count": "err" }))),
        bridgeQueryKey("maat_evidence_count").then(r => setKpis(p => ({ ...p, "maat_evidence_count": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "maat_evidence_count": "err" }))),
        bridgeQueryKey("maat_rules_count").then(r => setKpis(p => ({ ...p, "maat_rules_count": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "maat_rules_count": "err" }))),
        bridgeQueryKey("maat_cum_loss").then(r => setKpis(p => ({ ...p, "maat_cum_loss": r[0]?.value ?? r[0] ?? "—" }))).catch(() => setKpis(p => ({ ...p, "maat_cum_loss": "err" }))),
        bridgeQueryKey("maat_pl_master").then(r => setData(p => ({ ...p, "maat_pl_master": r }))).catch(() => setData(p => ({ ...p, "maat_pl_master": [] }))),
        bridgeQueryKey("maat_rdti").then(r => setData(p => ({ ...p, "maat_rdti": r }))).catch(() => setData(p => ({ ...p, "maat_rdti": [] }))),
        bridgeQueryKey("maat_monthly_pl").then(r => setData(p => ({ ...p, "maat_monthly_pl": r }))).catch(() => setData(p => ({ ...p, "maat_monthly_pl": [] }))),
        bridgeQueryKey("maat_gst").then(r => setData(p => ({ ...p, "maat_gst": r }))).catch(() => setData(p => ({ ...p, "maat_gst": [] }))),
        bridgeQueryKey("maat_deadlines").then(r => setData(p => ({ ...p, "maat_deadlines": r }))).catch(() => setData(p => ({ ...p, "maat_deadlines": [] }))),
        bridgeQueryKey("maat_rpt_pack_readiness").then(r => setData(p => ({ ...p, "maat_rpt_pack_readiness": r }))).catch(() => setData(p => ({ ...p, "maat_rpt_pack_readiness": [] }))),
        bridgeQueryKey("maat_vendors").then(r => setData(p => ({ ...p, "maat_vendors": r }))).catch(() => setData(p => ({ ...p, "maat_vendors": [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">MAAT</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:maat · live · no hardcoded data</p></div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">{ld ? "↻ Loading…" : "↻ Refresh"}</button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}
      {Object.keys(kpis).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SC label="Transactions" v={kpis["maat_txn_count"]} ld={ld} />
          <SC label="Evidence" v={kpis["maat_evidence_count"]} ld={ld} />
          <SC label="Rules" v={kpis["maat_rules_count"]} ld={ld} />
          <SC label="Cum. Loss" v={kpis["maat_cum_loss"]} ld={ld} />
        </div>
      )}
      <div className="space-y-4">
        <Sec title="P&L by FY" n={(data["maat_pl_master"] || []).length}>
          <DT rows={data["maat_pl_master"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">fy</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">revenue</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">total_expense</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">net_loss</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">rdti_refund</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["fy"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["revenue"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["total_expense"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["net_loss"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["rdti_refund"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="RDTI by FY" n={(data["maat_rdti"] || []).length}>
          <DT rows={data["maat_rdti"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">fy</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">rd_spend</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">rdti_refund</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">refund_rate</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["fy"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["rd_spend"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["rdti_refund"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["refund_rate"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Monthly P&L" n={(data["maat_monthly_pl"] || []).length}>
          <DT rows={data["maat_monthly_pl"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">month</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">entity</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">income</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">expenses</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">net</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["month"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["entity"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["income"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["expenses"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["net"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="GST Summary" n={(data["maat_gst"] || []).length}>
          <DT rows={data["maat_gst"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">period</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">gst_collected</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">gst_paid</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">net_gst</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["period"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["gst_collected"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["gst_paid"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["net_gst"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Deadlines" n={(data["maat_deadlines"] || []).length}>
          <DT rows={data["maat_deadlines"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">deadline_type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">due_date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">entity</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">status</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">amount</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["deadline_type"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["due_date"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["entity"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["status"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["amount"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Pack Readiness" n={(data["maat_rpt_pack_readiness"] || []).length}>
          <DT rows={data["maat_rpt_pack_readiness"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">pack_name</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">total_items</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">live_items</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">readiness_pct</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["pack_name"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["total_items"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["live_items"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["readiness_pct"] ?? "—")}</td></tr>}
          />
        </Sec>
        <Sec title="Unclassified Vendors" n={(data["maat_vendors"] || []).length}>
          <DT rows={data["maat_vendors"]} ld={ld}
            head={() => <tr className="border-b border-slate-700 bg-slate-900/50"><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">vendor</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">transaction_count</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">total_amount</th></tr>}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20"><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["vendor"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["transaction_count"] ?? "—")}</td><td className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{String(r["total_amount"] ?? "—")}</td></tr>}
          />
        </Sec>
      </div>
    </div>
  );
};

export default MAATPage;