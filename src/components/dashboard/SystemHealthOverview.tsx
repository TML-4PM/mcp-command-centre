interface SystemHealthOverviewProps {
  systemHealth: Record<string, string>;
  lambdas: {
    total: number;
    functions: Array<{
      name: string;
      status: string;
      last_run: string;
    }>;
  };
}

const SystemHealthOverview = ({ systemHealth, lambdas }: SystemHealthOverviewProps) => {
  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'text-success' : 'text-destructive';
  };

  const healthyCount = Object.values(systemHealth).filter(s => s === 'healthy').length;
  const totalCount = Object.keys(systemHealth).length;
  const healthPercentage = (healthyCount / totalCount) * 100;

  return (
    <div className="glass p-6 rounded-lg border border-border">
      <h3 className="text-xl font-semibold mb-4 text-foreground">System Health Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Overall Health</span>
            <span className="text-2xl font-bold text-foreground">{healthPercentage.toFixed(0)}%</span>
          </div>
          
          <div className="space-y-3">
            {Object.entries(systemHealth).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between">
                <span className="text-sm text-foreground capitalize">{service}</span>
                <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Lambda Functions ({lambdas.total})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lambdas.functions.map((fn) => (
              <div key={fn.name} className="p-2 rounded bg-background/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{fn.name}</span>
                  <span className={`text-xs ${getStatusColor(fn.status)}`}>
                    {fn.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Last run: {fn.last_run}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthOverview;
