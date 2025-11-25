interface BusinessUnitCardProps {
  name: string;
  status: string;
  health: number;
}

const BusinessUnitCard = ({ name, status, health }: BusinessUnitCardProps) => {
  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-400';
    if (health >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'slow':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'stalled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getHealthRing = (health: number) => {
    const rotation = (health / 100) * 360;
    return `conic-gradient(hsl(var(--primary)) ${rotation}deg, hsl(var(--border)) ${rotation}deg)`;
  };

  return (
    <div className="glass p-4 rounded-lg border border-border hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-foreground">{name}</h4>
        <span className={`text-xs px-2 py-1 rounded border ${getStatusBadgeColor(status)}`}>
          {status}
        </span>
      </div>

      <div className="flex items-center justify-center my-4">
        <div className="relative w-20 h-20">
          <div 
            className="absolute inset-0 rounded-full"
            style={{ background: getHealthRing(health) }}
          />
          <div className="absolute inset-1 rounded-full bg-card flex items-center justify-center">
            <span className={`text-xl font-bold ${getHealthColor(health)}`}>
              {health}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs text-muted-foreground">Health Score</span>
      </div>
    </div>
  );
};

export default BusinessUnitCard;
