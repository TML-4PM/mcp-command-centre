interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
}

const StatCard = ({ label, value, icon }: StatCardProps) => {
  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

export default StatCard;
