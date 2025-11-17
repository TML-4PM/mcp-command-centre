import { RefreshCw, FileText, Activity, Download, Search, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QuickActions = () => {
  const { toast } = useToast();

  const actions = [
    { icon: GitBranch, label: "Sync Repos", color: "blue" },
    { icon: FileText, label: "Generate Report", color: "purple" },
    { icon: Activity, label: "Health Check", color: "green" },
    { icon: Download, label: "Export Data", color: "yellow" },
    { icon: Search, label: "Deep Search", color: "cyan" },
    { icon: RefreshCw, label: "Refresh All", color: "pink" },
  ];

  const handleAction = (label: string) => {
    toast({
      title: "Action Triggered",
      description: `${label} initiated successfully`,
    });
  };

  return (
    <div className="glass p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleAction(action.label)}
            className="p-4 rounded-lg bg-card hover:bg-accent transition-all border border-border hover:border-primary/50 flex flex-col items-center gap-2"
          >
            <action.icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
