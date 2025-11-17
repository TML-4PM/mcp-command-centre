import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  status: string;
  detected_at: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('task_tracker')
        .select('*')
        .neq('status', 'completed')
        .order('detected_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Tasks fetch failed:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const priorityConfig = {
    critical: { class: 'border-red-500 bg-red-900/20', label: 'Critical' },
    high: { class: 'border-orange-500 bg-orange-900/20', label: 'High' },
    medium: { class: 'border-yellow-500 bg-yellow-900/20', label: 'Medium' },
    low: { class: 'border-blue-500 bg-blue-900/20', label: 'Low' }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Task Tracker</h1>
        <p className="text-muted-foreground mt-2">All unfinished tasks marked with @@@@@</p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No tasks found</div>
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 20).map((task) => {
            const config = priorityConfig[task.priority] || priorityConfig.medium;
            return (
              <div key={task.id} className={`p-4 rounded-lg border-2 ${config.class}`}>
                <div className="text-foreground font-medium mb-2">{task.content}</div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="capitalize">{config.label} priority</span>
                  <span>•</span>
                  <span>{task.category || 'general'}</span>
                  <span>•</span>
                  <span>{new Date(task.detected_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
