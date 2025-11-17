import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardEnhancedProps {
  icon: string;
  title: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'yellow';
  trend?: number;
  trendLabel?: string;
}

const MetricCardEnhanced = ({ icon, title, value, color, trend, trendLabel = "vs yesterday" }: MetricCardEnhancedProps) => {
  const gradients = {
    blue: 'from-blue-600 to-blue-400',
    purple: 'from-purple-600 to-purple-400',
    green: 'from-green-600 to-green-400',
    yellow: 'from-yellow-600 to-yellow-400'
  };

  const hasTrend = trend !== undefined;
  const isPositive = trend && trend > 0;

  return (
    <div className="metric-card p-6 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${gradients[color]} text-white text-xs font-semibold`}>
          LIVE
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{title}</div>
        {hasTrend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend!).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCardEnhanced;
