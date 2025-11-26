import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Info } from "lucide-react";

interface SystemHealth {
  github: string;
  supabase: string;
  lambdas: string;
  s3: string;
}

interface BusinessUnit {
  name: string;
  status: string;
  health: number;
}

interface Infrastructure {
  aws_spend_month: string;
  github_repos: number;
  scheduled_jobs_today: number;
  api_calls_today: number;
  errors_last_24h: number;
}

interface Alert {
  level: string;
  message: string;
  timestamp: string;
}

interface DashboardData {
  system_health: SystemHealth;
  business_units: BusinessUnit[];
  infrastructure: Infrastructure;
  alerts: Alert[];
  timestamp: string;
}

const MCPCommandCentre = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://32sux667kmm23wh3bjjjh4y6fa0afinn.lambda-url.ap-southeast-2.on.aws/"
      );
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    return status === "healthy" ? "success" : "destructive";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/20 text-success border-success/30";
      case "slow":
        return "bg-warning/20 text-warning border-warning/30";
      case "stalled":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getAlertStyle = (level: string) => {
    switch (level) {
      case "warning":
        return {
          border: "border-warning/30",
          bg: "bg-warning/10",
          text: "text-warning",
          icon: AlertCircle,
        };
      case "info":
        return {
          border: "border-info/30",
          bg: "bg-info/10",
          text: "text-info",
          icon: Info,
        };
      case "error":
        return {
          border: "border-destructive/30",
          bg: "bg-destructive/10",
          text: "text-destructive",
          icon: AlertCircle,
        };
      default:
        return {
          border: "border-border",
          bg: "bg-muted",
          text: "text-muted-foreground",
          icon: Info,
        };
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-success";
    if (health >= 50) return "text-warning";
    return "text-destructive";
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-foreground text-xl">Loading command centre...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">🚀 MCP Command Centre</h1>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-success rounded-full animate-pulse" />
            <span className="text-success font-semibold">LIVE</span>
          </div>
        </header>

        {/* System Health Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(data.system_health).map(([service, status]) => (
            <div
              key={service}
              className={`glass p-6 rounded-lg border-2 ${
                status === "healthy" ? "border-success/50" : "border-destructive/50"
              }`}
            >
              <div className="text-sm text-muted-foreground uppercase mb-2">
                {service}
              </div>
              <div className={`text-xl font-bold text-${getStatusColor(status)}`}>
                {status}
              </div>
            </div>
          ))}
        </div>

        {/* Business Units Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Business Units</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.business_units.map((unit) => (
              <div
                key={unit.name}
                className="glass p-6 rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{unit.name}</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${getStatusBadgeColor(
                      unit.status
                    )}`}
                  >
                    {unit.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Health Score
                    </span>
                    <span className={`text-xl font-bold ${getHealthColor(unit.health)}`}>
                      {unit.health}%
                    </span>
                  </div>
                  <Progress value={unit.health} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Infrastructure</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="glass p-6 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-2">AWS Spend</div>
              <div className="text-2xl font-bold">{data.infrastructure.aws_spend_month}</div>
            </div>
            <div className="glass p-6 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-2">GitHub Repos</div>
              <div className="text-2xl font-bold">{data.infrastructure.github_repos}</div>
            </div>
            <div className="glass p-6 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-2">Scheduled Jobs</div>
              <div className="text-2xl font-bold">
                {data.infrastructure.scheduled_jobs_today}
              </div>
            </div>
            <div className="glass p-6 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-2">API Calls</div>
              <div className="text-2xl font-bold">
                {data.infrastructure.api_calls_today.toLocaleString()}
              </div>
            </div>
            <div
              className={`glass p-6 rounded-lg border ${
                data.infrastructure.errors_last_24h > 0
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-border"
              }`}
            >
              <div className="text-sm text-muted-foreground mb-2">Errors (24h)</div>
              <div
                className={`text-2xl font-bold ${
                  data.infrastructure.errors_last_24h > 0
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {data.infrastructure.errors_last_24h}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Feed */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Alerts ({data.alerts.length})
          </h2>
          <div className="glass p-6 rounded-lg border border-border">
            {data.alerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No active alerts
              </div>
            ) : (
              <div className="space-y-3">
                {data.alerts.map((alert, index) => {
                  const style = getAlertStyle(alert.level);
                  const Icon = style.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${style.border} ${style.bg}`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 ${style.text}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${style.text}`}>
                          {alert.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTime(alert.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-muted-foreground text-sm">
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "..."}
        </footer>
      </div>
    </div>
  );
};

export default MCPCommandCentre;
