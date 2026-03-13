import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Activity, ShieldCheck, GitBranch, AlertTriangle,
  Archive, Zap, TrendingUp, CheckCircle, XCircle, Clock, Database
} from "lucide-react";

/* ── types ── */
interface PackRow { id: string; pack_name: string; profile_type: string; lifecycle_state: string; biz_key: string; }
interface PromotionRow { pack_id: string; pack_name: string; lifecycle_state: string; latest_dry_run_status: string; promotion_ready: string; }
interface ClassRow { pack_name: string; run_mode: string; classification: string; rationale: string; }
interface EvidenceRow { run_id: string; pack_name: string; classification: string; completeness_score: number; mandatory_types_met: string; smoke_pass_status: string; }
interface FailureRow { pack_name: string; phase_name: string; exception_code: string; severity: string; exception_message: string; rollback_available: string; }
interface LineageRow { pack_name: string; lifecycle_state: string; dry_run_status: string; lineage_state: string; }
interface RollbackRow { pack_name: string; unresolved_debt: number; critical_debt: number; rollback_count: number; last_rollback_status: string; }
interface ShortcutRow { trigger: string; label: string; lifecycle_state: string; usage_count: number; total_chars_saved: number; effort_ratio: number; }
interface ThroughputRow { run_day: string; run_mode: string; run_count: number; avg_duration_seconds: number; }
interface ArchiveRow { pack_name: string; archive_reason: string; classification: string; reusable: string; template_candidate: string; evidence_count: number; }

/* ── helpers ── */
const cls = (c: string) =>
  c === "REAL" ? "text-emerald-400" : c === "PARTIAL" ? "text-amber-400" : c === "PRETEND" ? "text-red-400" : "text-slate-400";
const sev = (s: string) =>
  s === "critical" ? "bg-red-900/40 text-red-300" : s === "error" ? "bg-orange-900/40 text-orange-300" : "bg-slate-800 text-slate-300";
const ls = (s: string) =>
  s === "CLEAN" ? "text-emerald-400" : s === "AWAITING_PRODUCTION" ? "text-amber-400" : "text-red-400";
const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : "—";

/* ── CCQ keys ── */
const Q = {
  packs:      "select id::text,pack_name,profile_type,lifecycle_state,biz_key from public.v_execution_pack_summary order by updated_at desc limit 20",
  promotion:  "select pack_id::text,pack_name,lifecycle_state,latest_dry_run_status,promotion_ready::text from public.v_pack_promotion_readiness order by pack_name",
  class_:     "select pack_name,run_mode,classification,rationale from public.v_classification_audit order by started_at desc limit 20",
  evidence:   "select run_id::text,pack_name,classification,completeness_score,mandatory_types_met::text,smoke_pass_status::text from public.v_execution_evidence_health order by finalized_at desc limit 20",
  failures:   "select pack_name,phase_name,exception_code,severity,exception_message,rollback_available::text from public.v_failure_queue_enriched order by created_at desc limit 20",
  lineage:    "select pack_name,lifecycle_state,dry_run_status,lineage_state from public.v_lineage_gap_report order by pack_name",
  rollback:   "select pack_name,unresolved_debt,critical_debt,rollback_count,last_rollback_status from public.v_rollback_health order by unresolved_debt desc,rollback_count desc",
  shortcuts:  "select trigger,label,lifecycle_state,usage_count,total_chars_saved,effort_ratio from public.v_shortcut_ops_dashboard order by usage_count desc",
  throughput: "select run_day::text,run_mode,run_count,avg_duration_seconds from public.v_runtime_throughput order by run_day desc limit 30",
  archive:    "select pack_name,archive_reason,classification,reusable::text,template_candidate::text,evidence_count from public.v_pack_archive_full order by archived_at desc limit 20",
};

/* ── hook ── */
function useQ<T>(sql: string, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await bridgeSQL(sql); setData(r ?? []); } catch { setData([]); }
    finally { setLoading(false); }
  }, [sql]);
  useEffect(() => { load(); }, [load, ...deps]);
  return { data, loading, reload: load };
}

/* ── component ── */
const ExecSpine = () => {
  const [tick, setTick] = useState(0);
  const reload = () => setTick(t => t + 1);

  const packs      = useQ<PackRow>(Q.packs, [tick]);
  const promotion  = useQ<PromotionRow>(Q.promotion, [tick]);
  const class_     = useQ<ClassRow>(Q.class_, [tick]);
  const evidence   = useQ<EvidenceRow>(Q.evidence, [tick]);
  const failures   = useQ<FailureRow>(Q.failures, [tick]);
  const lineage    = useQ<LineageRow>(Q.lineage, [tick]);
  const rollback   = useQ<RollbackRow>(Q.rollback, [tick]);
  const shortcuts  = useQ<ShortcutRow>(Q.shortcuts, [tick]);
  const throughput = useQ<ThroughputRow>(Q.throughput, [tick]);
  const archive    = useQ<ArchiveRow>(Q.archive, [tick]);

  const real  = class_.data.filter(r => r.classification === "REAL").length;
  const part  = class_.data.filter(r => r.classification === "PARTIAL").length;
  const pret  = class_.data.filter(r => r.classification === "PRETEND").length;
  const crit  = failures.data.filter(r => r.severity === "critical").length;
  const clean = lineage.data.filter(r => r.lineage_state === "CLEAN").length;
  const debt  = rollback.data.reduce((a, r) => a + r.unresolved_debt, 0);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" /> Execution Spine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Universal Pack Execution — Live Runtime Truth</p>
        </div>
        <Button onClick={reload} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* scorecard */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Packs", value: packs.data.length, icon: <Database className="w-4 h-4" />, color: "text-blue-400" },
          { label: "REAL", value: real, icon: <CheckCircle className="w-4 h-4" />, color: "text-emerald-400" },
          { label: "PARTIAL", value: part, icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
          { label: "PRETEND", value: pret, icon: <XCircle className="w-4 h-4" />, color: "text-red-400" },
          { label: "Failures", value: crit, icon: <AlertTriangle className="w-4 h-4" />, color: crit > 0 ? "text-red-400" : "text-emerald-400" },
          { label: "Debt", value: debt, icon: <TrendingUp className="w-4 h-4" />, color: debt > 0 ? "text-orange-400" : "text-emerald-400" },
        ].map(({ label, value, icon, color }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* pack pipeline + promotion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><Database className="w-4 h-4 text-blue-400"/>Pack Pipeline</CardTitle></CardHeader>
          <CardContent>
            {packs.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            packs.data.length === 0 ? <div className="text-slate-500 text-xs">no packs</div> :
            <div className="space-y-1.5">
              {packs.data.map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[160px]">{r.pack_name}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-500">{r.profile_type}</span>
                    <Badge variant="outline" className="text-xs py-0">{r.lifecycle_state}</Badge>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><ShieldCheck className="w-4 h-4 text-blue-400"/>Promotion Readiness</CardTitle></CardHeader>
          <CardContent>
            {promotion.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            <div className="space-y-1.5">
              {promotion.data.map(r => (
                <div key={r.pack_id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[160px]">{r.pack_name}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-500">{r.latest_dry_run_status ?? "—"}</span>
                    <span className={r.promotion_ready === "true" ? "text-emerald-400" : "text-slate-500"}>
                      {r.promotion_ready === "true" ? "ready" : "not ready"}
                    </span>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </div>

      {/* evidence health + classification audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><Activity className="w-4 h-4 text-cyan-400"/>Evidence Health</CardTitle></CardHeader>
          <CardContent>
            {evidence.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            evidence.data.length === 0 ? <div className="text-slate-500 text-xs">no runs yet</div> :
            <div className="space-y-2">
              {evidence.data.slice(0,8).map(r => (
                <div key={r.run_id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[120px]">{r.pack_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{width:`${r.completeness_score}%`}}/>
                    </div>
                    <span className="text-slate-400 w-6">{r.completeness_score}</span>
                    <span className={`w-12 text-right ${cls(r.classification)}`}>{r.classification}</span>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-400"/>Classification Audit</CardTitle></CardHeader>
          <CardContent>
            {class_.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            <div className="space-y-1.5">
              {class_.data.slice(0,8).map((r,i) => (
                <div key={i} className="flex items-start justify-between text-xs gap-2">
                  <span className="text-slate-300 truncate max-w-[110px]">{r.pack_name}</span>
                  <span className="text-slate-500 shrink-0">{r.run_mode}</span>
                  <span className={`shrink-0 font-mono ${cls(r.classification)}`}>{r.classification}</span>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </div>

      {/* lineage + rollback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><GitBranch className="w-4 h-4 text-purple-400"/>Lineage Gap Report</CardTitle></CardHeader>
          <CardContent>
            {lineage.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            lineage.data.length === 0 ? <div className="text-slate-500 text-xs">no packs</div> :
            <div className="space-y-1.5">
              {lineage.data.map((r,i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[150px]">{r.pack_name}</span>
                  <span className={ls(r.lineage_state)}>{r.lineage_state}</span>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><AlertTriangle className="w-4 h-4 text-orange-400"/>Rollback Health</CardTitle></CardHeader>
          <CardContent>
            {rollback.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            rollback.data.length === 0 ? <div className="text-slate-500 text-xs">no rollback data</div> :
            <div className="space-y-1.5">
              {rollback.data.map((r,i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[140px]">{r.pack_name}</span>
                  <div className="flex gap-3">
                    <span className={r.unresolved_debt > 0 ? "text-red-400" : "text-slate-500"}>debt:{r.unresolved_debt}</span>
                    <span className="text-slate-400">{r.last_rollback_status}</span>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </div>

      {/* failure queue */}
      {failures.data.length > 0 && (
        <Card className="bg-slate-900 border-red-900/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-300 flex gap-2"><AlertTriangle className="w-4 h-4"/>Failure Queue</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failures.data.slice(0,6).map((r,i) => (
                <div key={i} className={`rounded px-2 py-1.5 text-xs flex items-start justify-between ${sev(r.severity)}`}>
                  <div className="space-y-0.5">
                    <div className="font-mono">{r.exception_code}</div>
                    <div className="text-slate-400">{r.pack_name} · {r.phase_name}</div>
                    <div className="text-slate-300">{r.exception_message}</div>
                  </div>
                  <span className={r.rollback_available === "true" ? "text-emerald-400 ml-2 shrink-0" : "text-slate-500 ml-2 shrink-0"}>
                    {r.rollback_available === "true" ? "rollback" : "no rollback"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* shortcuts + throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><Zap className="w-4 h-4 text-yellow-400"/>Shortcut Value</CardTitle></CardHeader>
          <CardContent>
            {shortcuts.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            <div className="space-y-1.5">
              {shortcuts.data.map(r => (
                <div key={r.trigger} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-yellow-400">{r.trigger}</span>
                  <div className="flex gap-3 text-slate-400">
                    <span>×{r.usage_count}</span>
                    <span>{r.total_chars_saved}ch saved</span>
                    <span>×{r.effort_ratio}</span>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><TrendingUp className="w-4 h-4 text-blue-400"/>Runtime Throughput</CardTitle></CardHeader>
          <CardContent>
            {throughput.loading ? <div className="text-slate-500 text-xs">loading...</div> :
            throughput.data.length === 0 ? <div className="text-slate-500 text-xs">no runs yet</div> :
            <div className="space-y-1.5">
              {throughput.data.slice(0,8).map((r,i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{r.run_day}</span>
                  <span className="text-slate-500">{r.run_mode}</span>
                  <span className="text-blue-400">{r.run_count} runs</span>
                  <span className="text-slate-400">{r.avg_duration_seconds}s avg</span>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </div>

      {/* archive library */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300 flex gap-2"><Archive className="w-4 h-4 text-purple-400"/>Archive Library — Reusable REAL Packs</CardTitle></CardHeader>
        <CardContent>
          {archive.loading ? <div className="text-slate-500 text-xs">loading...</div> :
          archive.data.length === 0 ? <div className="text-slate-500 text-xs">no archived packs</div> :
          <div className="space-y-1.5">
            {archive.data.map((r,i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[180px]">{r.pack_name}</span>
                <div className="flex gap-2 items-center">
                  <span className={cls(r.classification)}>{r.classification}</span>
                  {r.reusable === "true" && <Badge variant="outline" className="text-xs py-0 text-emerald-400 border-emerald-400/30">reusable</Badge>}
                  {r.template_candidate === "true" && <Badge variant="outline" className="text-xs py-0 text-purple-400 border-purple-400/30">template</Badge>}
                  <span className="text-slate-500">{r.evidence_count} ev</span>
                </div>
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecSpine;
