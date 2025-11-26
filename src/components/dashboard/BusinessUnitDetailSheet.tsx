import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, Zap, Clock } from "lucide-react";

interface BusinessUnit {
  name: string;
  status: string;
  health: number;
}

interface Alert {
  level: string;
  message: string;
  timestamp: string;
}

interface BusinessUnitDetailSheetProps {
  unit: BusinessUnit | null;
  onClose: () => void;
  alerts: Alert[];
}

const BusinessUnitDetailSheet = ({ unit, onClose, alerts }: BusinessUnitDetailSheetProps) => {
  if (!unit) return null;

  // Generate simulated health history based on current health
  const generateHealthHistory = (currentHealth: number) => {
    const days = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', '1d ago', 'Now'];
    return days.map((day, index) => ({
      date: day,
      health: Math.max(0, Math.min(100, currentHealth + (Math.random() - 0.5) * 10))
    }));
  };

  // Generate simulated metrics
  const uptime = (99 + (unit.health / 100)).toFixed(2) + '%';
  const apiCalls = Math.floor(50000 + Math.random() * 100000);
  const errorRate = ((100 - unit.health) / 20).toFixed(2) + '%';
  const avgResponseTime = Math.floor(50 + (100 - unit.health) * 2) + 'ms';

  // Generate recent activity
  const recentActivity = [
    { action: 'Health check passed', timestamp: '2m ago', type: 'success' as const },
    { action: 'Configuration updated', timestamp: '15m ago', type: 'info' as const },
    { action: 'Performance spike detected', timestamp: '1h ago', type: 'warning' as const },
    { action: 'Deployment completed', timestamp: '3h ago', type: 'success' as const },
    { action: 'Routine maintenance', timestamp: '6h ago', type: 'info' as const }
  ];

  const healthHistory = generateHealthHistory(unit.health);
  const relatedAlerts = alerts.filter(alert => 
    alert.message.toLowerCase().includes(unit.name.toLowerCase())
  ).slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'slow': return 'bg-yellow-500';
      case 'stalled': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  return (
    <Sheet open={!!unit} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] bg-slate-900 border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl">{unit.name}</SheetTitle>
            <Badge className={getStatusColor(unit.status)}>{unit.status}</Badge>
          </div>
          <div className="text-4xl font-bold text-green-500 mt-2">
            {unit.health}% Health
          </div>
        </SheetHeader>

        {/* Health History Chart */}
        <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-border">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Health History (7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={healthHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Line 
                type="monotone" 
                dataKey="health" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Uptime</span>
            </div>
            <div className="text-xl font-bold">{uptime}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs">API Calls</span>
            </div>
            <div className="text-xl font-bold">{apiCalls.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Error Rate</span>
            </div>
            <div className="text-xl font-bold">{errorRate}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Avg Response</span>
            </div>
            <div className="text-xl font-bold">{avgResponseTime}</div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-border">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`} />
                <div className="flex-1">
                  <div className="text-sm">{activity.action}</div>
                  <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related Alerts */}
        {relatedAlerts.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Related Alerts</h3>
            <div className="space-y-2">
              {relatedAlerts.map((alert, index) => (
                <div key={index} className="p-2 rounded bg-slate-700/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alert.level === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                      {alert.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                  </div>
                  <div className="text-sm">{alert.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full">View Logs</Button>
          <Button variant="outline" className="w-full">Run Health Check</Button>
          <Button variant="outline" className="w-full">View Documentation</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BusinessUnitDetailSheet;
