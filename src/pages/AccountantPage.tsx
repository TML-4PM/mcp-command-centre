import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";

// ─── Types ────────────────────────────────────────────────────────────────────
type DocStatus = "COMPLETE" | "LOCATED" | "SUBSTRATE" | "MISSING";
interface DocItem {
  doc_key: string; wave_label: string; section_label: string;
  document_title: string; status: DocStatus;
  supabase_query: string | null; lodgement_required: boolean; audit_core: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum = (v: any) => {
  const n = Number(v);
  if (isNaN(n)) return String(v ?? "—");
  if (Math.abs(n) >= 1_000_000) return "$" + (n/1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return "$" + n.toLocaleString("en-AU");
  return String(v ?? "—");
};
const fmt = (v: any) => (v === null || v === undefined) ? "—" : String(v);
const statusColour: Record<DocStatus, string> = {
  COMPLETE: "bg-green-500/20 text-green-400 border-green-500/30",
  LOCATED:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SUBSTRATE:"bg-amber-500/20 text-amber-400 border-amber-500/30",
  MISSING:  "bg-red-500/20 text-red-400 border-red-500/30",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, warn }: { label: string; value: any; sub?: string; warn?: boolean }) => (
  <div className={`rounded-xl p-4 border ${warn ? "border-red-500/40 bg-red-900/10" : "border-slate-700 bg-slate-800/60"}`}>
    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-2xl font-bold font-mono ${warn ? "text-red-400" : "text-white"}`}>{fmt(value)}</div>
    {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
  </div>
);

const Tbl = ({ rows, ld }: { rows: any[]; ld: boolean }) => {
  if (ld) return <div className="h-12 flex items-center justify-center text-slate-600 text-sm animate-pulse">Loading…</div>;
  if (!rows?.length) return <div className="h-10 flex items-center justify-center text-slate-700 text-sm">No data</div>;
  const keys = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto max-h-72">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-slate-700 bg-slate-900/60 sticky top-0">
          {keys.map(k => <th key={k} className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{k}</th>)}
        </tr></thead>
        <tbody>{rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20">
            {keys.map(k => <td key={k} className="px-3 py-1.5 text-slate-300 max-w-xs truncate">{fmt(row[k])}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

// ─── Report card with live Generate button ────────────────────────────────────
const ReportCard = ({ doc }: { doc: DocItem }) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const generate = async () => {
    if (!doc.supabase_query) return;
    setLoading(true); setOpen(true);
    try {
      const sql = doc.supabase_query.includes("LIMIT") ? doc.supabase_query : doc.supabase_query + " LIMIT 200";
      const res = await bridgeSQL(sql);
      setRows(res?.rows || []);
      setRan(true);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  const canGenerate = !!doc.supabase_query && doc.status !== "MISSING";
  const badge = statusColour[doc.status] || statusColour.MISSING;

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${badge}`}>{doc.status}</span>
            {doc.lodgement_required && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-500/30">LODGE</span>}
            {doc.audit_core && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-500/30">AUDIT</span>}
          </div>
          <div className="text-sm text-slate-200 font-medium mt-1">{doc.document_title}</div>
          <div className="text-xs text-slate-600 mt-0.5">{doc.section_label}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canGenerate && (
            <button
              onClick={generate}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-40 transition-colors"
            >
              {loading ? "…" : ran ? "↻ Refresh" : "▶ Generate"}
            </button>
          )}
          {canGenerate && ran && (
            <button onClick={() => setOpen(o => !o)} className="px-2 py-1.5 text-xs rounded-lg border border-slate-600 text-slate-400 hover:text-white">
              {open ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-700">
          <Tbl rows={rows} ld={loading} />
          {ran && !loading && rows.length > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-700/50 text-xs text-slate-600 font-mono">
              {rows.length} rows · {doc.supabase_query?.substring(0,80)}…
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── AI query box ─────────────────────────────────────────────────────────────
const QueryBox = () => {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true); setAnswer("");
    try {
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a financial analyst assistant for Tech 4 Humanity Pty Ltd (ABN 61 605 746 618), answering questions for the accountant Andrew Douglas at Hales Redden. 
You have access to the MAAT financial system with: 6,039 transactions, $2.59M in 4-year RDTI claims, 43.5% refundable offset, 30 Apr 2026 RDTI lodgement deadline (42 days away), 6 BAS quarters calculated. 
The company is a sole-director R&D-focused tech portfolio with 28 businesses under one ABN. All expenses are from the owner.
Be concise, precise, and professional. Use Australian accounting context.`,
          messages: [{ role: "user", content: q }]
        })
      });
      const ai = await anthropicRes.json();
      setAnswer(ai.content?.[0]?.text || "No response");
    } catch (e: any) {
      setAnswer("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">🤖 Ask MAAT</h3>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
          placeholder="e.g. What's the total GST refundable? What's my RDTI exposure this year?"
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={ask} disabled={loading || !q.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-40 transition-colors font-medium"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="mt-3 p-3 bg-slate-900/60 rounded-lg border border-slate-600 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

// ─── RDTI Research Roadmap Widget ─────────────────────────────────────────────
const ROADMAP_ROWS = [
  { fy: "FY 2024/25", status: "Complete", colour: "text-green-400", assets: "Safe Media Countdown · Calm Bound App · AI Sweet Spots (seed)", output: "Child safety IP · Hypothesis established · RDTI-eligible" },
  { fy: "FY 2025/26", status: "Active",   colour: "text-blue-400",  assets: "Cognitive Research Hub · AI Sweet Spots full cohorts (Neurodivergent · Elderly · Indigenous · ESL) · Altered states · Time-of-day · Crossover threads", output: "R&D spend across 4 populations · Platform infrastructure" },
  { fy: "FY 2026/27", status: "Planned",  colour: "text-amber-400", assets: "T4H Research Hub · Discover Your AI Sweet Spot · When to AI (SaaS) · R U Good @ AI? · AI Olympics", output: "SaaS revenue · Licensing · Consumer brand" },
  { fy: "Today — Live", status: "Live",   colour: "text-purple-400",assets: "Outcome Ready (NDIS) · Thriving Kids (NDIS) · MyNeuralSignal · LifeGraph · WorkFamilyAI · augmentedhumanity.coach", output: "Active NDIS service revenue · Health platform" },
  { fy: "Coming",      status: "Pipeline",colour: "text-slate-400", assets: "MNS Research (clinical) · One-Click Agents · 2E School — Valdocco Primary · Books & Courses · Govt/Defence — Far-Cage agentic design", output: "Clinical revenue · Govt contracts · Publishing · Sovereign AI" },
];

const RDTI_THESIS = `RDTI REGISTRATION ARGUMENT — FY2024/25 onward

Core registrable activity: systematic experimentation to resolve genuine uncertainty about which AI modalities produce optimal outcomes for specific human populations under specific conditions.

Three years of evidence:
• FY24/25 — proof of concept in child safety & wellbeing. Established research practice, two registered assets.
• FY25/26 — hypothesis broadens to four underserved populations. Cognitive Research Hub becomes infrastructure. RDTI-eligible R&D spend across all threads.
• FY26/27 — IP converts to tools: assessments, SaaS, benchmarking. Research becomes product.

Today: live revenue-path businesses (NDIS, MyNeuralSignal) funded by this knowledge base — proofs of the thesis in market.

The products are the commercial application of resolved uncertainty. That is the registrable core.

AusIndustry R&D Registration FY2024/25:
Tracking ID: PYV4R3VPW | Submitted: 20 Mar 2026 | DONE ✓

Immediate action items for Andrew:
1. Lodge current BAS (briefing: 25 Mar 2026)
2. Review RDTI registration PYV4R3VPW
3. Advise on contractor ABN gap — $47,500 at risk
4. Confirm FY 2022/23 status to eliminate ATO exposure
5. Consider client introductions for NDIS investment or SaaS pilot

Tech 4 Humanity Pty Ltd | ABN 61 605 746 618 | troy@tech4humanity.com.au`;

const RdtiRoadmap = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState("");

  const sendToAndrew = async () => {
    setSending(true); setSendErr(""); setSent(false);
    try {
      const res = await fetch("https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4",
          "x-api-key": "bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4"
        },
        body: JSON.stringify({
          fn: "troy-email-send",
          to: "andrew.douglas@halesredden.com.au",
          cc: "troy@tech4humanity.com.au",
          subject: "Tech 4 Humanity — Research IP & RDTI Briefing (March 2026)",
          body: RDTI_THESIS
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSent(true);
    } catch (e: any) {
      setSendErr(e.message);
    }
    setSending(false);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">🔬 Research IP Roadmap — RDTI Investment Story</h3>
          <p className="text-xs text-slate-600 mt-0.5">3 FYs of compounding IP → products → revenue · AusIndustry tracking ID: PYV4R3VPW</p>
        </div>
        <div className="flex items-center gap-2">
          {sent && <span className="text-xs text-green-400 font-mono">✓ Sent to Andrew</span>}
          {sendErr && <span className="text-xs text-red-400 font-mono truncate max-w-48">{sendErr}</span>}
          <button
            onClick={sendToAndrew}
            disabled={sending}
            className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {sending ? "Sending…" : "📧 Send to Andrew"}
          </button>
        </div>
      </div>

      {/* Roadmap table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider w-28">Period</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider w-20">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Key Assets</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider w-64">Commercial Output</th>
            </tr>
          </thead>
          <tbody>
            {ROADMAP_ROWS.map((row, i) => (
              <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/10">
                <td className={`px-3 py-2 font-semibold font-mono whitespace-nowrap ${row.colour}`}>{row.fy}</td>
                <td className="px-3 py-2 text-slate-400">{row.status}</td>
                <td className="px-3 py-2 text-slate-300 leading-relaxed">{row.assets}</td>
                <td className="px-3 py-2 text-slate-400 leading-relaxed">{row.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Thesis box */}
      <div className="border-t border-slate-700 px-4 py-3 bg-slate-900/40">
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="text-indigo-400 font-semibold">RDTI core argument:</span>{" "}
          Systematic experimentation to resolve genuine uncertainty — which AI modalities work for which humans, under which conditions.
          The products are commercial application of resolved uncertainty. Every FY from 24/25 onward is registrable.
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 font-mono">
          <span className="text-green-400">✓ PYV4R3VPW registered 20 Mar 2026</span>
          <span>· 30 Apr 2026 deadline</span>
          <span>· 810+ IP assets</span>
          <span>· 74 Green</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AccountantPage = () => {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [tableData, setTableData] = useState<Record<string, any[]>>({});
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLd(true); setErr(null);
    try {
      const kpiRes = await bridgeSQL(`SELECT
        (SELECT COUNT(*) FROM maat_transactions WHERE is_estimate IS NOT TRUE) AS txn_count,
        (SELECT COUNT(*) FROM maat_evidence) AS evidence_count,
        (SELECT ROUND(SUM(rdti_refund)::numeric,0) FROM v_rdti_by_fy) AS rdti_4yr_total,
        (SELECT ROUND(SUM(amount)::numeric,0) FROM maat_transactions WHERE is_estimate IS NOT TRUE) AS cum_loss,
        ('2026-04-30'::date - NOW()::date) AS days_to_rdti,
        (SELECT COUNT(*) FROM maat_bas_submissions WHERE status='calculated') AS bas_calculated`);
      if (kpiRes?.rows?.[0]) setKpis(kpiRes.rows[0]);

      const docResult = await bridgeSQL(`SELECT doc_key, wave_label, section_label, document_title,
        status, supabase_query, lodgement_required, audit_core
        FROM maat_doc_matrix ORDER BY wave_label, section_label, doc_key`);
      setDocs((docResult?.rows || []) as DocItem[]);

      const tables: Array<{ key: string; sql: string }> = [
        { key: "pl_master",     sql: "SELECT * FROM v_pl_master" },
        { key: "rdti",          sql: "SELECT * FROM v_rdti_by_fy" },
        { key: "bas",           sql: "SELECT financial_year, quarter, period_start::text, period_end::text, status, ROUND(gst_collected::numeric,2) as gst_collected, ROUND(gst_paid::numeric,2) as gst_paid, ROUND(gst_net::numeric,2) as net_gst, amount_refundable FROM maat_bas_submissions ORDER BY period_start DESC" },
        { key: "tax_position",  sql: "SELECT * FROM v_maat_tax_position LIMIT 20" },
        { key: "invoices",      sql: "SELECT * FROM v_invoice_summary_by_fy" },
        { key: "director_loan", sql: "SELECT * FROM v_director_loan_by_fy" },
        { key: "personal_tax",  sql: "SELECT fy, gross, deductions, taxable_income, tax_paid, income_tax, medicare, mls FROM inventory.v_personal_tax_final ORDER BY fy DESC" },
        { key: "claim_ready",   sql: "SELECT rd_spend, offset_rate, hours_logged, fy26_spend, fy26_claimed, fy26_gap, journals FROM (SELECT (data->>'total_rd_spend')::numeric AS rd_spend,(data->>'offset_rate')::numeric AS offset_rate,(data->>'total_hours')::numeric AS hours_logged,(data->>'fy26_spend')::numeric AS fy26_spend,(data->>'fy26_claimed')::numeric AS fy26_claimed,(data->>'fy26_gap')::integer AS fy26_gap,(data->>'total_journals')::integer AS journals FROM v_maat_api_claim_readiness) x" },
        { key: "rd_projects",   sql: "SELECT project_code, project_name, txn_count, ROUND(total_allocated::numeric,2) as allocated, ROUND(rd_rebate::numeric,2) as rebate FROM v_maat_rd_summary_corrected ORDER BY rebate DESC" },
        { key: "ledger",        sql: "SELECT source, journals, ROUND(debits::numeric,2) as debits, status, reality FROM v_maat_api_ledger LIMIT 20" },
      ];

      for (const t of tables) {
        try {
          const result = await bridgeSQL(t.sql);
          const rows = result.rows;
          setTableData(p => ({ ...p, [t.key]: rows || [] }));
        } catch { setTableData(p => ({ ...p, [t.key]: [] })); }
      }
    } catch (e: any) { setErr(e.message); }
    finally { setLd(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const waves = docs.reduce((acc, d) => {
    if (!acc[d.wave_label]) acc[d.wave_label] = [];
    acc[d.wave_label].push(d);
    return acc;
  }, {} as Record<string, DocItem[]>);

  const waveOrder = ["Lodgement Spine", "Accountant Backbone", "MAAT Reconciliation Closure",
    "Corporate Legal Existential", "IP & System Defensibility", "Strategic & Investor Layer"];

  const tableSections = [
    { key: "pl_master",     title: "P&L by Financial Year",       cols: ["fy","revenue","opex","rd_bank","net_loss","rdti_refund"] },
    { key: "rdti",          title: "RDTI by Financial Year",       cols: ["fy","labour","bank_rd","total_eligible","rdti_refund"] },
    { key: "bas",           title: "BAS Statements",               cols: ["financial_year","quarter","period_start","period_end","status","gst_collected","gst_paid","net_gst","amount_refundable"] },
    { key: "invoices",      title: "Invoice Summary by FY",        cols: null },
    { key: "tax_position",  title: "Corporate Tax Position",       cols: null },
    { key: "personal_tax",  title: "Personal Tax Position",        cols: null },
    { key: "director_loan", title: "Director Loan by FY",          cols: null },
    { key: "claim_ready",   title: "R&D Claim Readiness",          cols: null },
    { key: "rd_projects",   title: "R&D Projects (Active)",        cols: null },
    { key: "ledger",        title: "General Ledger Summary",       cols: null },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Accountant</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">Andrew Douglas — Hales Redden · MAAT live · {docs.length} documents tracked</p>
        </div>
        <button onClick={load} disabled={ld}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">
          {ld ? "↻ Loading…" : "↻ Refresh All"}
        </button>
      </div>

      {err && <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm font-mono">{err}</div>}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI label="Transactions" value={kpis.txn_count?.toLocaleString()} />
        <KPI label="Evidence Items" value={kpis.evidence_count?.toLocaleString()} />
        <KPI label="4yr RDTI" value={kpis.rdti_4yr_total ? fmtNum(kpis.rdti_4yr_total) : "—"} />
        <KPI label="Cum. Loss" value={kpis.cum_loss ? fmtNum(kpis.cum_loss) : "—"} />
        <KPI label="BAS Calculated" value={kpis.bas_calculated} sub="quarters ready" />
        <KPI label="Days to RDTI" value={kpis.days_to_rdti} sub="30 Apr 2026" warn={Number(kpis.days_to_rdti) < 50} />
      </div>

      {/* RDTI Roadmap Widget */}
      <RdtiRoadmap />

      {/* AI Query Box */}
      <QueryBox />

      {/* Financial Data Tables */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-slate-200">📊 Financial Statements</h2>
        <div className="space-y-3">
          {tableSections.map(sec => {
            const rows = tableData[sec.key] || [];
            const displayRows = sec.cols ? rows.map(r => {
              const o: any = {};
              sec.cols!.forEach(c => { if (r[c] !== undefined) o[c] = r[c]; });
              return o;
            }) : rows;
            return (
              <details key={sec.key} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden" open={["pl_master","rdti","bas"].includes(sec.key)}>
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-slate-700/20 transition-colors list-none">
                  <span className="text-sm font-semibold text-slate-300">{sec.title}</span>
                  <span className="text-xs text-slate-500 font-mono">{ld ? "loading…" : `${rows.length} rows`}</span>
                </summary>
                <div className="border-t border-slate-700">
                  <Tbl rows={displayRows} ld={ld} />
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* Document Matrix */}
      <div>
        <h2 className="text-lg font-semibold mb-1 text-slate-200">📁 Document Register</h2>
        <p className="text-xs text-slate-600 mb-4">
          {docs.length} documents across {Object.keys(waves).length} waves ·{" "}
          <span className="text-green-500">{docs.filter(d=>d.status==="COMPLETE").length} complete</span> ·{" "}
          <span className="text-blue-400">{docs.filter(d=>d.status==="LOCATED").length} located</span> ·{" "}
          <span className="text-amber-400">{docs.filter(d=>d.status==="SUBSTRATE").length} substrate</span> ·{" "}
          <span className="text-red-400">{docs.filter(d=>d.status==="MISSING").length} missing</span>
        </p>
        <div className="space-y-6">
          {(waveOrder.filter(w => waves[w])).map(wave => (
            <div key={wave}>
              <details open={["Lodgement Spine","Accountant Backbone"].includes(wave)}>
                <summary className="cursor-pointer flex items-center gap-3 mb-3 list-none group">
                  <h3 className="text-base font-semibold text-slate-200 group-hover:text-white transition-colors">{wave}</h3>
                  <span className="text-xs text-slate-600 font-mono">{waves[wave]?.length} docs</span>
                </summary>
                <div className="space-y-2 pl-2">
                  {waves[wave]?.map(doc => <ReportCard key={doc.doc_key} doc={doc} />)}
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountantPage;
