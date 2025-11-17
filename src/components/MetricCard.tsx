interface MetricCardProps {
  icon: string;
  title: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'yellow';
}

const MetricCard = ({ icon, title, value, color }: MetricCardProps) => {
  const gradients = {
    blue: 'from-blue-600 to-blue-400',
    purple: 'from-purple-600 to-purple-400',
    green: 'from-green-600 to-green-400',
    yellow: 'from-yellow-600 to-yellow-400'
  };

  return (
    <div className="metric-card p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${gradients[color]} text-white text-xs font-semibold`}>
          LIVE
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
};

export default MetricCard;
