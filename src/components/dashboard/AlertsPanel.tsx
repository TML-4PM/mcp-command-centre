import { AlertCircle, Info } from "lucide-react";

interface Alert {
  level: string;
  message: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
  const getAlertStyle = (level: string) => {
    switch (level) {
      case 'warning':
        return {
          border: 'border-yellow-500/30',
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-400',
          icon: AlertCircle,
        };
      case 'info':
        return {
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          icon: Info,
        };
      case 'error':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          icon: AlertCircle,
        };
      default:
        return {
          border: 'border-border',
          bg: 'bg-background/50',
          text: 'text-muted-foreground',
          icon: Info,
        };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="glass p-6 rounded-lg border border-border">
      <h3 className="text-xl font-semibold mb-4 text-foreground">
        Alerts ({alerts.length})
      </h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active alerts
          </div>
        ) : (
          alerts.map((alert, index) => {
            const style = getAlertStyle(alert.level);
            const Icon = style.icon;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${style.border} ${style.bg}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${style.text}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${style.text} mb-1`}>
                      {alert.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(alert.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
