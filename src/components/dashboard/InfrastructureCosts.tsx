interface InfrastructureCostsProps {
  infrastructure: {
    aws_spend_month: string;
    supabase_storage_gb: number;
    github_repos: number;
    scheduled_jobs_today: number;
    api_calls_today: number;
    errors_last_24h: number;
  };
}

const InfrastructureCosts = ({ infrastructure }: InfrastructureCostsProps) => {
  return (
    <div className="glass p-6 rounded-lg border border-border">
      <h3 className="text-xl font-semibold mb-4 text-foreground">Infrastructure</h3>
      
      <div className="mb-6">
        <div className="text-3xl font-bold text-primary mb-1">
          {infrastructure.aws_spend_month}
        </div>
        <div className="text-sm text-muted-foreground">AWS Spend This Month</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div>
            <div className="text-sm font-medium text-foreground">Storage</div>
            <div className="text-xs text-muted-foreground">Supabase</div>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {infrastructure.supabase_storage_gb} GB
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div>
            <div className="text-sm font-medium text-foreground">Repositories</div>
            <div className="text-xs text-muted-foreground">GitHub</div>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {infrastructure.github_repos}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div>
            <div className="text-sm font-medium text-foreground">API Calls</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {infrastructure.api_calls_today.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div>
            <div className="text-sm font-medium text-foreground">Scheduled Jobs</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {infrastructure.scheduled_jobs_today}
          </div>
        </div>

        {infrastructure.errors_last_24h > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div>
              <div className="text-sm font-medium text-destructive">Errors</div>
              <div className="text-xs text-destructive/70">Last 24h</div>
            </div>
            <div className="text-lg font-semibold text-destructive">
              {infrastructure.errors_last_24h}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfrastructureCosts;
