import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Activity, Clock, CheckCircle, AlertCircle, XCircle, Play,
  Pause, RefreshCw, Calendar, Timer, Cpu, Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  status: 'running' | 'completed' | 'failed' | 'pending' | 'disabled';
  lastRun: Date | null;
  nextRun: Date | null;
  duration?: number; // ms
  source: 'launchd' | 'cron' | 'lambda' | 'mcp_os';
  description: string;
}

interface JobsMonitorWidgetProps {
  compact?: boolean;
}

const JobsMonitorWidget = ({ compact = false }: JobsMonitorWidgetProps) => {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    // Fetch from dashboard_feeds or command_queue
    // Mock data based on context - these are the actual Mac LaunchAgents
    setJobs([
      {
        id: 'mcp-os',
        name: 'MCP Automation OS',
        schedule: 'Every 10s',
        status: 'running',
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 10000),
        duration: 245,
        source: 'launchd',
        description: 'Heartbeat, command queue, storage heat'
      },
      {
        id: 'master-cron',
        name: 'Master Cron',
        schedule: 'Every 5m',
        status: 'completed',
        lastRun: new Date(Date.now() - 180000),
        nextRun: new Date(Date.now() + 120000),
        duration: 1250,
        source: 'mcp_os',
        description: 'Update feeds, sync metrics'
      },
      {
        id: 'ingest-bridge',
        name: 'Ingest Bridge',
        schedule: 'Continuous',
        status: 'running',
        lastRun: new Date(Date.now() - 60000),
        nextRun: null,
        source: 'launchd',
        description: 'Process incoming data from all sources'
      },
      {
        id: 'command-worker',
        name: 'Command Worker',
        schedule: 'Every 2s',
        status: 'running',
        lastRun: new Date(Date.now() - 2000),
        nextRun: new Date(Date.now() + 2000),
        duration: 89,
        source: 'launchd',
        description: 'Execute queued commands'
      },
      {
        id: 'omnibrain',
        name: 'Omnibrain Consolidator',
        schedule: 'Daily 6am',
        status: 'completed',
        lastRun: new Date(Date.now() - 3600000 * 8),
        nextRun: new Date(Date.now() + 3600000 * 16),
        duration: 45000,
        source: 'lambda',
        description: 'Daily intelligence consolidation'
      },
      {
        id: 'linkedin-pipeline',
        name: 'LinkedIn Pipeline',
        schedule: 'Every 15m',
        status: 'failed',
        lastRun: new Date(Date.now() - 900000),
        nextRun: new Date(Date.now() + 900000),
        duration: 0,
        source: 'launchd',
        description: 'Scrape LinkedIn activity'
      },
      {
        id: 'chatgpt-auditor',
        name: 'ChatGPT Auditor',
        schedule: 'Every 30m',
        status: 'pending',
        lastRun: new Date(Date.now() - 1800000),
        nextRun: new Date(Date.now() + 600000),
        source: 'launchd',
        description: 'Audit and sync GPT conversations'
      },
      {
        id: 'storage-metrics',
        name: 'Storage Metrics',
        schedule: 'Hourly',
        status: 'completed',
        lastRun: new Date(Date.now() - 2400000),
        nextRun: new Date(Date.now() + 1200000),
        duration: 3200,
        source: 'lambda',
        description: 'Collect storage usage across S3 buckets'
      }
    ]);
    setIsLoading(false);
  };

  const getStatusIcon = (status: ScheduledJob['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disabled':
        return <Pause className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ScheduledJob['status']) => {
    const styles: Record<string, string> = {
      running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      disabled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const getSourceBadge = (source: ScheduledJob['source']) => {
    const styles: Record<string, string> = {
      launchd: 'bg-purple-500/20 text-purple-400',
      cron: 'bg-orange-500/20 text-orange-400',
      lambda: 'bg-yellow-500/20 text-yellow-400',
      mcp_os: 'bg-blue-500/20 text-blue-400'
    };
    return <Badge variant="outline" className={styles[source]}>{source}</Badge>;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const runningCount = jobs.filter(j => j.status === 'running').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Jobs Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-400">{runningCount} running</Badge>
              {failedCount > 0 && (
                <Badge className="bg-red-500/20 text-red-400">{failedCount} failed</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-medium text-sm">{job.name}</div>
                      <div className="text-xs text-muted-foreground">{job.schedule}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {job.lastRun?.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Jobs & Cron Monitor
            </CardTitle>
            <CardDescription>Scheduled jobs, LaunchAgents, and automation tasks</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {runningCount} Active
            </Badge>
            {failedCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {failedCount} Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className={`p-4 rounded-lg border ${
                job.status === 'failed' ? 'border-red-500/30 bg-red-500/5' :
                job.status === 'running' ? 'border-blue-500/30 bg-blue-500/5' :
                'border-border/50 bg-muted/20'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {job.name}
                      {getSourceBadge(job.source)}
                    </div>
                    <div className="text-sm text-muted-foreground">{job.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(job.status)}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-border/30">
                <div>
                  <div className="text-xs text-muted-foreground">Schedule</div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {job.schedule}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last Run</div>
                  <div className="text-sm font-medium">
                    {job.lastRun?.toLocaleTimeString() || 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Next Run</div>
                  <div className="text-sm font-medium">
                    {job.nextRun?.toLocaleTimeString() || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-sm font-medium">{formatDuration(job.duration)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobsMonitorWidget;
