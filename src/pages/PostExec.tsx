import { useEffect, useState, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Activity, Zap, BookOpen, GitBranch,
  Archive, TrendingUp, AlertTriangle, CheckCircle, Clock, Database
} from "lucide-react";

/* ── types ── */
interface PipelineRow {
  execution_id: string; biz_key: string; execution_status: string;
  callback_received_at: string; duration_ms: number;
  reality_classification: string; evidence_status: string;
  artifact_count: number; telemetry_count: number;
  open_findings: number; follow_on_count: number;
  automation_level: number; overall_score: number;
}
interface FindingRow {
  biz_key: string; finding_type: string; severity: string;
  finding_count: number; latest_finding_at: string;
}
interface FollowOnRow {
  follow_on_job_id: string; parent_execution_id: string;
  child_job_type: string; child_job_key: string;
  trigger_reason: string; priority: number; autonomy_tier: string;
  status: string; created_at: string;
}
interface ScoreRow {
  scored_day: string; biz_key: string; avg_score: number;
  peak_level: number; total_steps_eliminated: number;
  total_autonomous_decisions: number; run_count: number;
}

const STATUS_COLOUR: Record<string, string> = {
  SUCCESS: "bg-green-500", FAILED: "bg-red-500",
  PARTIAL: "bg-yellow-500", TIMEOUT: "bg-orange-500", CANCELLED: "bg-gray-400",
};
const SEV_COLOUR: Record<string, string> = {
  CRITICAL: "bg-red-600", HIGH: "bg-orange-500", MEDIUM: "bg-yellow-500", LOW: "bg-blue-400",
};
const LEVEL_COLOUR = (l: number) =>
  l >= 23 ? "bg-purple-600" : l >= 20 ? "bg-indigo-500" : l >= 15 ? "bg-blue-500" :
  l >= 10 ? "bg-teal-500" : "bg-gray-400";

export default function PostExec() {
  const [pipeline, setPipeline]   = useState<PipelineRow[]>([]);
  const [findings, setFindings]   = useState<FindingRow[]>([]);
  const [followOn, setFollowOn]   = useState<FollowOnRow[]>([]);
  const [progress, setProgress]   = useState<ScoreRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, f, foj, s] = await Promise.all([
        bridgeSQL("SELECT execution_id, biz_key, execution_status, callback_received_at, duration_ms, reality_classification, evidence_status, artifact_count, telemetry_count, open_findings, follow_on_count, automation_level, overall_score FROM ops.v_post_exec_pipeline ORDER BY callback_received_at DESC LIMIT 20"),
        bridgeSQL("SELECT biz_key, finding_type, severity, finding_count, latest_finding_at FROM ops.v_learning_hotspots ORDER BY latest_finding_at DESC LIMIT 20"),
        bridgeSQL("SELECT follow_on_job_id, parent_execution_id, child_job_type, child_job_key, trigger_reason, priority, autonomy_tier, status, created_at FROM ops.v_follow_on_queue LIMIT 25"),
        bridgeSQL("SELECT scored_day, biz_key, avg_score, peak_level, total_steps_eliminated, total_autonomous_decisions, run_count FROM ops.v_automation_progress ORDER BY scored_day DESC LIMIT 20"),
      ]);
      setPipeline(p || []);
      setFindings(f || []);
      setFollowOn(foj || []);
      setProgress(s || []);
      setLastRefresh(new Date().toLocaleTimeString("en-AU"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRuns      = pipeline.length;
  const successRate    = totalRuns ? Math.round(pipeline.filter(r => r.execution_status === "SUCCESS").length / totalRuns * 100) : 0;
  const avgScore       = pipeline.length ? Math.round(pipeline.reduce((s,r) => s + (r.overall_score||0), 0) / pipeline.length) : 0;
  const openFindings   = findings.reduce((s, f) => s + f.finding_count, 0);
  const queuedJobs     = followOn.filter(f => f.status === "QUEUED").length;
  const peakLevel      = pipeline.reduce((m, r) => Math.max(m, r.automation_level||0), 0);

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-400" /> Post-Execution Spine
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Bridge callback → Evidence binding → Learning loop → Automation scoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && <span className="text-xs text-gray-500">Refreshed {lastRefresh}</span>}
          <Button onClick={load} disabled={loading} size="sm" variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total Runs", value: totalRuns, icon: <Database className="w-4 h-4" />, colour: "text-blue-400" },
          { label: "Success Rate", value: `${successRate}%`, icon: <CheckCircle className="w-4 h-4" />, colour: "text-green-400" },
          { label: "Avg Score", value: avgScore, icon: <TrendingUp className="w-4 h-4" />, colour: "text-purple-400" },
          { label: "Peak Level", value: peakLevel, icon: <Zap className="w-4 h-4" />, colour: "text-yellow-400" },
          { label: "Open Findings", value: openFindings, icon: <AlertTriangle className="w-4 h-4" />, colour: "text-orange-400" },
          { label: "Queued Jobs", value: queuedJobs, icon: <Clock className="w-4 h-4" />, colour: "text-teal-400" },
        ].map(k => (
          <Card key={k.label} className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className={`flex items-center gap-1 text-xs text-gray-400 mb-1 ${k.colour}`}>
                {k.icon} {k.label}
              </div>
              <div className="text-2xl font-bold text-white">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Execution Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  {["Execution ID","Biz","Status","Duration","Classification","Evidence","Artifacts","Follow-Ons","Level","Score"].map(h => (
                    <th key={h} className="text-left p-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pipeline.map(r => (
                  <tr key={r.execution_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-2 font-mono text-gray-300 max-w-[120px] truncate">{r.execution_id}</td>
                    <td className="p-2 text-gray-300">{r.biz_key}</td>
                    <td className="p-2">
                      <Badge className={`${STATUS_COLOUR[r.execution_status]||"bg-gray-600"} text-white text-xs`}>
                        {r.execution_status}
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-400">{r.duration_ms ? `${(r.duration_ms/1000).toFixed(1)}s` : "—"}</td>
                    <td className="p-2 text-gray-300">{r.reality_classification || "—"}</td>
                    <td className="p-2 text-gray-300">{r.evidence_status || "—"}</td>
                    <td className="p-2 text-center text-gray-300">{r.artifact_count}</td>
                    <td className="p-2 text-center text-gray-300">{r.follow_on_count}</td>
                    <td className="p-2">
                      {r.automation_level ? (
                        <Badge className={`${LEVEL_COLOUR(r.automation_level)} text-white text-xs`}>L{r.automation_level}</Badge>
                      ) : "—"}
                    </td>
                    <td className="p-2 font-bold text-white">{r.overall_score ?? "—"}</td>
                  </tr>
                ))}
                {!pipeline.length && (
                  <tr><td colSpan={10} className="p-4 text-center text-gray-500">No executions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Learning hotspots + Follow-on queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-400" /> Learning Hotspots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {findings.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <div>
                    <span className="text-xs text-gray-200 font-medium">{f.finding_type}</span>
                    <span className="text-xs text-gray-500 ml-2">{f.biz_key || "global"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${SEV_COLOUR[f.severity]||"bg-gray-500"} text-white text-xs`}>{f.severity}</Badge>
                    <span className="text-xs text-gray-400">{f.finding_count}x</span>
                  </div>
                </div>
              ))}
              {!findings.length && <p className="text-gray-500 text-xs text-center py-2">No findings</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-teal-400" /> Follow-On Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {followOn.map((j, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <div>
                    <span className="text-xs text-gray-200 font-medium">{j.child_job_type}</span>
                    <span className="text-xs text-gray-500 ml-2">{j.trigger_reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-teal-700 text-white text-xs">{j.autonomy_tier}</Badge>
                    <Badge className={`${j.status==="QUEUED"?"bg-blue-600":"bg-green-600"} text-white text-xs`}>{j.status}</Badge>
                  </div>
                </div>
              ))}
              {!followOn.length && <p className="text-gray-500 text-xs text-center py-2">Queue empty</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation progress */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" /> Automation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  {["Day","Biz","Avg Score","Peak Level","Steps Eliminated","Autonomous Decisions","Runs"].map(h => (
                    <th key={h} className="text-left p-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress.map((r, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-2 text-gray-400">{new Date(r.scored_day).toLocaleDateString("en-AU")}</td>
                    <td className="p-2 text-gray-300">{r.biz_key}</td>
                    <td className="p-2 font-bold text-white">{r.avg_score}</td>
                    <td className="p-2">
                      <Badge className={`${LEVEL_COLOUR(r.peak_level)} text-white text-xs`}>L{r.peak_level}</Badge>
                    </td>
                    <td className="p-2 text-gray-300">{r.total_steps_eliminated}</td>
                    <td className="p-2 text-gray-300">{r.total_autonomous_decisions}</td>
                    <td className="p-2 text-gray-400">{r.run_count}</td>
                  </tr>
                ))}
                {!progress.length && (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">No scoring data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
