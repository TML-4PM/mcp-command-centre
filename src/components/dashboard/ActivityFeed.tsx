import { MessageSquare, Code, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityItem {
  id: string;
  type: 'conversation' | 'code' | 'system';
  title: string;
  timestamp: Date;
  metadata?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'conversation': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'code': return <Code className="w-4 h-4 text-purple-500" />;
      case 'system': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="glass p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {activity.metadata && (
                      <p className="text-xs text-muted-foreground truncate">{activity.metadata}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityFeed;
