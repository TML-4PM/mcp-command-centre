import { useEffect, useState, useCallback } from "react";
import { bridgeQueryKey, bridgeSQL } from "@/lib/bridge";

const fmt = (v: any): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    // unwrap common single-key count objects: {count: N}, {value: N}, {total: N}
    const keys = Object.keys(v);
    if (keys.length === 1) return String(v[keys[0]]);
    return JSON.stringify(v);
  }
  return String(v);
};

const fmtMoney = (v: any): string => {
  const n = Number(v);
  if (isNaN(n)) return fmt(v);
  return n < 0
    ? `-$${Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const SC = ({ label: l, v, ld, money }: { label: string; v: any; ld: boolean; money?: boolean }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 truncate">{l}</div>
    <div className="text-2xl font-bold text-white font-mono">
      {ld ? <span className="animate-pulse text-slate-600">—</span> : (money ? fmtMoney(v) : fmt(v))}
    </div>
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

const TH = ({ cols }: { cols: string[] }) => (
  <tr className="border-b border-slate-700 bg-slate-900/50">
    {cols.map(c => <th key={c} className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{c}</th>)}
  </tr>
);

const TD = ({ vals }: { vals: any[] }) => (
  <tr className="border-b border-slate-700/40 hover:bg-slate-700/20">
    {vals.map((v, i) => <td key={i} className="px-3 py-2 text-xs text-slate-300 max-w-xs truncate">{fmt(v)}</td>)}
  </tr>
);

const MAATPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      // KPI keys — extract scalar correctly from {count:N} or {value:N} shapes
      const resolveKpi = async (key: string): Promise<any> => {
        const rows = await bridgeQueryKey(key);
        const first = rows?.[0];
        if (!first) return "—";
        // If object has exactly one key, unwrap it (handles {count:N}, {sum:N} etc)
        if (typeof first === "object") {
          const keys = Object.keys(first);
          if (keys.length === 1) return first[keys[0]];
        }
        return first;
      };

      // FY P&L from maat_transactions (real bank data, not v_pl_master which is RDTI-only)
      const plFy = bridgeSQL(`
        SELECT
          CASE
            WHEN posted_at < '2023-07-01' THEN 'FY22-23'
            WHEN posted_at < '2024-07-01' THEN 'FY23-24'
            WHEN posted_at < '2025-07-01' THEN 'FY24-25'
            ELSE 'FY25-26'
          END as fy,
          ROUND(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END),0) as revenue,
          ROUND(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)),0) as expenses,
          ROUND(SUM(amount),0) as net,
          COUNT(*) as txns
        FROM maat_transactions
        WHERE is_estimate IS NOT TRUE
        GROUP BY 1 ORDER BY 1
      `).then(r => r.rows).catch(() => []);

      await Promise.allSettled([
        resolveKpi("maat_txn_count").then(v => setKpis(p => ({ ...p, txn_count: v }))),
        resolveKpi("maat_evidence_count").then(v => setKpis(p => ({ ...p, evidence_count: v }))),
        resolveKpi("maat_rules_count").then(v => setKpis(p => ({ ...p, rules_count: v }))),
        resolveKpi("maat_cum_loss").then(v => setKpis(p => ({ ...p, cum_loss: v }))),
        plFy.then(r => setData(p => ({ ...p, pl_fy: r }))),
        bridgeQueryKey("maat_rdti").then(r => setData(p => ({ ...p, rdti: r }))).catch(() => setData(p => ({ ...p, rdti: [] }))),
        bridgeQueryKey("maat_monthly_pl").then(r => setData(p => ({ ...p, monthly_pl: r }))).catch(() => setData(p => ({ ...p, monthly_pl: [] }))),
        bridgeQueryKey("maat_gst").then(r => setData(p => ({ ...p, gst: r }))).catch(() => setData(p => ({ ...p, gst: [] }))),
        bridgeQueryKey("maat_deadlines").then(r => setData(p => ({ ...p, deadlines: r }))).catch(() => setData(p => ({ ...p, deadlines: [] }))),
        bridgeQueryKey("maat_rpt_pack_readiness").then(r => setData(p => ({ ...p, pack: r }))).catch(() => setData(p => ({ ...p, pack: [] }))),
        bridgeQueryKey("maat_vendors").then(r => setData(p => ({ ...p, vendors: r }))).catch(() => setData(p => ({ ...p, vendors: [] }))),
      ]);
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">MAAT</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">page_id:maat · live · no hardcoded data</p>
        </div>
        <button onClick={load} disabled={ld} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">
          {ld ? "↻ Loading…" : "↻ Refresh"}
        </button>
      </div>
      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SC label="Transactions" v={kpis.txn_count} ld={ld} />
        <SC label="Evidence" v={kpis.evidence_count} ld={ld} />
        <SC label="Rules" v={kpis.rules_count} ld={ld} />
        <SC label="Cum. R&D Loss" v={kpis.cum_loss} ld={ld} money />
      </div>

      <div className="space-y-4">
        <Sec title="P&L by FY (Bank Transactions)" n={(data.pl_fy || []).length}>
          <DT rows={data.pl_fy || []} ld={ld}
            head={() => <TH cols={["FY", "Revenue", "Expenses", "Net", "Txns"]} />}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-xs font-mono text-slate-300">{fmt(r.fy)}</td>
              <td className="px-3 py-2 text-xs text-green-400">{fmtMoney(r.revenue)}</td>
              <td className="px-3 py-2 text-xs text-red-400">{fmtMoney(r.expenses)}</td>
              <td className={`px-3 py-2 text-xs font-semibold ${Number(r.net) >= 0 ? "text-green-300" : "text-red-300"}`}>{fmtMoney(r.net)}</td>
              <td className="px-3 py-2 text-xs text-slate-400">{fmt(r.txns)}</td>
            </tr>}
          />
        </Sec>

        <Sec title="RDTI by FY" n={(data.rdti || []).length}>
          <DT rows={data.rdti || []} ld={ld}
            head={() => <TH cols={["FY", "R&D Spend", "RDTI Refund", "Refund Rate"]} />}
            row={(r, i) => <TD key={i} vals={[r.fy, fmtMoney(r.rd_spend), fmtMoney(r.rdti_refund), r.refund_rate ? `${r.refund_rate}%` : "—"]} />}
          />
        </Sec>

        <Sec title="Monthly P&L" n={(data.monthly_pl || []).length}>
          <DT rows={data.monthly_pl || []} ld={ld}
            head={() => <TH cols={["Month", "Income", "Expenses", "Net", "Txns"]} />}
            row={(r, i) => <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20">
              <td className="px-3 py-2 text-xs font-mono text-slate-300">{fmt(r.month)}</td>
              <td className="px-3 py-2 text-xs text-green-400">{fmtMoney(r.income)}</td>
              <td className="px-3 py-2 text-xs text-red-400">{fmtMoney(r.expenses)}</td>
              <td className={`px-3 py-2 text-xs font-semibold ${Number(r.net) >= 0 ? "text-green-300" : "text-red-300"}`}>{fmtMoney(r.net)}</td>
              <td className="px-3 py-2 text-xs text-slate-400">{fmt(r.txn_count)}</td>
            </tr>}
          />
        </Sec>

        <Sec title="GST Summary" n={(data.gst || []).length}>
          <DT rows={data.gst || []} ld={ld}
            head={() => <TH cols={["Period", "GST Collected", "GST Paid", "Net GST", "Status"]} />}
            row={(r, i) => <TD key={i} vals={[r.period, fmtMoney(r.gst_collected), fmtMoney(r.gst_paid), fmtMoney(r.net_gst), r.status]} />}
          />
        </Sec>

        <Sec title="Deadlines" n={(data.deadlines || []).length}>
          <DT rows={data.deadlines || []} ld={ld}
            head={() => <TH cols={["Type", "Due Date", "Entity", "Status", "Amount"]} />}
            row={(r, i) => <TD key={i} vals={[r.deadline_type, r.due_date, r.entity, r.status, r.amount ? fmtMoney(r.amount) : "—"]} />}
          />
        </Sec>

        <Sec title="Pack Readiness" n={(data.pack || []).length}>
          <DT rows={data.pack || []} ld={ld}
            head={() => <TH cols={["Pack", "Total", "Live", "Readiness"]} />}
            row={(r, i) => <TD key={i} vals={[r.pack_name ?? r.pack_slug, r.total_items, r.live_items, r.readiness_pct ? `${r.readiness_pct}%` : "—"]} />}
          />
        </Sec>

        <Sec title="Unclassified Vendors" n={(data.vendors || []).length}>
          <DT rows={data.vendors || []} ld={ld}
            head={() => <TH cols={["Vendor", "Txn Count", "Total Amount"]} />}
            row={(r, i) => <TD key={i} vals={[r.vendor, r.transaction_count, fmtMoney(r.total_amount)]} />}
          />
        </Sec>
      </div>
    </div>
  );
};

export default MAATPage;
