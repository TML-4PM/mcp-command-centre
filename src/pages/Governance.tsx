import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw, Shield, Download, CheckCircle, AlertTriangle,
  Clock, Lock, FileText, Activity, ChevronDown, ChevronUp, Copy, Check
} from "lucide-react";

/* ─── types ─── */
interface HealthRow {
  proposals_build_authorised: number;
  outputs_live: number;
  snapshots_passing: number;
  snapshots_locked: number;
  total_lifecycle_events: number;
  rdti_status: string;
}
interface OutputRow {
  output_slug: string;
  output_name: string;
  domain: string;
  state: string;
  pack_state: string;
  last_refreshed_at: string | null;
}
interface ProposalRow {
  proposal_slug: string;
  system_name: string;
  state: string;
  domain: string;
  total_score: number | null;
  decision_outcome: string | null;
  locked_at: string | null;
  build_authorised_at: string | null;
}
interface LifecycleRow {
  entity_type: string;
  event_type: string;
  from_state: string;
  to_state: string;
  actor: string;
  logged_at: string;
}
interface RdtiRow {
  deadline_date: string;
  days_remaining: number;
  rdti_status: string;
}
interface ResearchRow {
  sweetspot_records: number;
  participants: number;
  results: number;
  t4h_assets: number;
  registered_assets: number;
}

/* ─── helpers ─── */
const STATE_COLOR: Record<string, string> = {
  build_authorised: "text-emerald-400",
  locked: "text-blue-400",
  accepted: "text-blue-400",
  live: "text-emerald-400",
  registered: "text-slate-400",
  source_mapped: "text-amber-400",
  checks_attached: "text-amber-400",
  snapshot_ready: "text-cyan-400",
  pack_bound: "text-cyan-400",
  closed_complete: "text-purple-400",
};
const stateColor = (s: string) => STATE_COLOR[s] ?? "text-slate-400";

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtTs = (d: string) => new Date(d).toLocaleString("en-AU", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });

/* ─── component ─── */
const Governance = () => {
  const [health, setHealth] = useState<HealthRow | null>(null);
  const [outputs, setOutputs] = useState<OutputRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleRow[]>([]);
  const [rdti, setRdti] = useState<RdtiRow | null>(null);
  const [research, setResearch] = useState<ResearchRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [exportHash, setExportHash] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, outputsRes, proposalsRes, lifecycleRes, rdtiRes, researchRes] = await Promise.all([
        bridgeSQL("SELECT * FROM agoe.v_agoe_health LIMIT 1"),
        bridgeSQL("SELECT output_slug, output_name, domain, state, pack_state, last_refreshed_at FROM agoe.agoe_outputs ORDER BY created_at"),
        bridgeSQL(`SELECT p.proposal_slug, p.system_name, p.state, p.domain,
          s.total_score, s.decision_outcome, p.locked_at, p.build_authorised_at
          FROM agoe.agoe_proposals p
          LEFT JOIN agoe.agoe_proposal_scores s ON s.proposal_id = p.id
          ORDER BY p.created_at DESC LIMIT 20`),
        bridgeSQL("SELECT entity_type, event_type, from_state, to_state, actor, logged_at FROM agoe.agoe_lifecycle_log ORDER BY logged_at DESC LIMIT 15"),
        bridgeSQL("SELECT * FROM agoe.v_agoe_rdti_deadline LIMIT 1"),
        bridgeSQL("SELECT * FROM agoe.v_ai_sweetspots_artefact_pipeline LIMIT 1"),
      ]);
      setHealth((healthRes.rows[0] as HealthRow) ?? null);
      setOutputs(outputsRes.rows as OutputRow[]);
      setProposals(proposalsRes.rows as ProposalRow[]);
      setLifecycle(lifecycleRes.rows as LifecycleRow[]);
      setRdti((rdtiRes.rows[0] as RdtiRow) ?? null);
      setResearch((researchRes.rows[0] as ResearchRow) ?? null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await bridgeSQL("SELECT agoe.fn_agoe_export_audit_pack() AS pack");
      const pack = res.rows[0]?.pack;
      const json = JSON.stringify(pack, null, 2);
      setExportJson(json);
      setExportHash(pack?.pack_integrity_hash ?? null);
      setShowExport(true);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  }, []);

  const handleDownload = () => {
    if (!exportJson) return;
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agoe-audit-pack-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHash = () => {
    if (!exportHash) return;
    navigator.clipboard.writeText(exportHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rdtiDays = rdti?.days_remaining ?? null;
  const rdtiUrgent = rdtiDays !== null && rdtiDays < 30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-400" />
            AGOE Governance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Autonomous Governance &amp; Output Engine · v4.0 · agoe schema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-violet-700 text-violet-300 hover:bg-violet-900/30"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting
              ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              : <Download className="w-4 h-4 mr-2" />}
            Export Audit Pack
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* RDTI Deadline Banner */}
      {rdti && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${
          rdtiUrgent
            ? "bg-red-950/40 border-red-700 text-red-300"
            : "bg-emerald-950/40 border-emerald-700 text-emerald-300"
        }`}>
          <div className="flex items-center gap-2 text-sm font-mono">
            <Clock className="w-4 h-4" />
            <span>RDTI Deadline: {fmt(rdti.deadline_date)}</span>
            <span className="text-slate-400">·</span>
            <span className={rdtiUrgent ? "text-red-400 font-bold" : "text-emerald-400"}>
              {rdtiDays} days remaining
            </span>
          </div>
          <Badge variant={rdtiUrgent ? "destructive" : "default"}>
            {rdti.rdti_status}
          </Badge>
        </div>
      )}

      {/* KPI row */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "PROPOSALS AUTHORISED", value: health.proposals_build_authorised, color: "text-emerald-400" },
            { label: "OUTPUTS LIVE", value: health.outputs_live, color: "text-blue-400" },
            { label: "SNAPSHOTS PASSING", value: health.snapshots_passing, color: "text-cyan-400" },
            { label: "SNAPSHOTS LOCKED", value: health.snapshots_locked, color: "text-purple-400" },
            { label: "LIFECYCLE EVENTS", value: health.total_lifecycle_events, color: "text-amber-400" },
          ].map(k => (
            <Card key={k.label} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-mono font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate-500 mt-1">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Proposals */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" /> Proposals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proposals.length === 0 && <p className="text-slate-500 text-xs">No proposals</p>}
            {proposals.map(p => (
              <div key={p.proposal_slug} className="p-2.5 rounded bg-slate-900/60 border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300">{p.proposal_slug}</span>
                  <Badge variant="outline" className={`text-xs py-0 h-4 border-0 ${stateColor(p.state)}`}>
                    {p.state}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400">{p.system_name}</div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>domain: <span className="text-slate-400">{p.domain}</span></span>
                  {p.total_score !== null && (
                    <span>score: <span className="text-emerald-400 font-mono">{p.total_score}/28</span></span>
                  )}
                  {p.decision_outcome && (
                    <span className="text-violet-400">{p.decision_outcome}</span>
                  )}
                </div>
                {(p.locked_at || p.build_authorised_at) && (
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    {p.locked_at && <span><Lock className="w-3 h-3 inline mr-0.5" />locked {fmt(p.locked_at)}</span>}
                    {p.build_authorised_at && <span><CheckCircle className="w-3 h-3 inline mr-0.5 text-emerald-600" />authorised {fmt(p.build_authorised_at)}</span>}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Engine B Outputs */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Engine B — Outputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outputs.length === 0 && <p className="text-slate-500 text-xs">No outputs</p>}
            {outputs.map(o => (
              <div key={o.output_slug} className="p-2.5 rounded bg-slate-900/60 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300">{o.output_slug}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-xs py-0 h-4 border-0 ${stateColor(o.state)}`}>
                      {o.state}
                    </Badge>
                    {o.pack_state && o.pack_state !== o.state && (
                      <Badge variant="outline" className="text-xs py-0 h-4 border-slate-600 text-slate-500">
                        {o.pack_state}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{o.output_name}</div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                  <span>domain: {o.domain}</span>
                  {o.last_refreshed_at && <span>refreshed {fmt(o.last_refreshed_at)}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Sweet Spots Pipeline */}
        {research && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-slate-300 flex items-center gap-2">
                🔬 AI Sweet Spots Research Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "SWEETSPOT RECORDS", value: research.sweetspot_records },
                  { label: "PARTICIPANTS", value: research.participants },
                  { label: "RESULTS", value: research.results },
                  { label: "T4H ASSETS", value: research.t4h_assets },
                  { label: "REGISTERED ASSETS", value: research.registered_assets },
                ].map(r => (
                  <div key={r.label} className="bg-slate-900/60 rounded p-2 text-center">
                    <div className="text-lg font-mono font-bold text-violet-400">{r.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-500">
                Source: agoe.v_ai_sweetspots_artefact_pipeline · Engine B output: research-artefact-pipeline
              </div>
            </CardContent>
          </Card>
        )}

        {/* Domain coverage */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" /> Domain Output Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-1.5">
              {["infrastructure","finance","rdti","bas","ndis","legal","research","workforce"].map(d => {
                const covered = outputs.filter(o => o.domain === d).length;
                const live = outputs.filter(o => o.domain === d && o.state === "live").length;
                return (
                  <div key={d} className="flex items-center justify-between p-1.5 rounded bg-slate-900/50">
                    <span className="text-xs font-mono text-slate-400">{d}</span>
                    <div className="flex items-center gap-1">
                      {covered > 0
                        ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                        : <AlertTriangle className="w-3 h-3 text-slate-600" />}
                      <span className={`text-xs font-mono ${live > 0 ? "text-emerald-400" : covered > 0 ? "text-amber-400" : "text-slate-600"}`}>
                        {live > 0 ? `${live} live` : covered > 0 ? "registered" : "none"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle Log */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> Lifecycle Log (last 15)
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setShowLog(!showLog)}>
              {showLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {showLog && (
          <CardContent>
            <div className="space-y-1">
              {lifecycle.map((l, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-slate-800">
                  <span className="text-slate-600 font-mono w-28 flex-shrink-0">{fmtTs(l.logged_at)}</span>
                  <span className="text-amber-400 w-24 flex-shrink-0">{l.event_type}</span>
                  <span className="text-slate-500">{l.from_state} → <span className="text-slate-300">{l.to_state}</span></span>
                  <span className="text-slate-600 truncate ml-auto">{l.actor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Audit Export Modal */}
      {showExport && exportJson && (
        <Card className="bg-slate-900 border-violet-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono text-violet-300 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Audit Pack Generated
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-slate-400" onClick={() => setShowExport(false)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {exportHash && (
              <div className="flex items-center gap-2 bg-slate-800 rounded p-2">
                <span className="text-xs text-slate-400">SHA-256:</span>
                <span className="text-xs font-mono text-violet-300 flex-1 truncate">{exportHash}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleCopyHash}>
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleDownload} className="bg-violet-700 hover:bg-violet-600">
                <Download className="w-4 h-4 mr-2" /> Download JSON
              </Button>
              <span className="text-xs text-slate-500">
                {(new Blob([exportJson]).size / 1024).toFixed(1)} KB · schema T4H-AGOE-BB-v4.0
              </span>
            </div>
            <pre className="text-xs font-mono text-slate-400 bg-slate-950 rounded p-3 overflow-auto max-h-48">
              {exportJson.slice(0, 800)}...
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Governance;
