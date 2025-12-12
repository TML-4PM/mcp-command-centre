import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, Clock, CheckCircle2, Circle, Plus, Trash2,
  ChevronLeft, ChevronRight, GripVertical, Star, AlertCircle,
  Flag, Target, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'data' | 'automation' | 'review' | 'planning';
  dueDate?: Date;
  timeEstimate?: string;
}

interface DayPlan {
  date: Date;
  dayName: string;
  tasks: Task[];
  focusArea?: string;
}

const WeeklyPlannerWidget = () => {
  const { toast } = useToast();
  const [weekPlans, setWeekPlans] = useState<DayPlan[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    generateWeekPlan();
  }, [weekOffset]);

  const generateWeekPlan = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Monday

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const focusAreas = [
      'Data Recovery Sprint',
      'Automation Review',
      'Dashboard Integration',
      'Source Consolidation',
      'Weekly Analytics',
      'System Maintenance',
      'Planning & Review'
    ];

    const sampleTasks: Record<string, Task[]> = {
      Monday: [
        { id: '1', title: 'Sync missing GPT conversations', completed: false, priority: 'high', category: 'data', timeEstimate: '2h' },
        { id: '2', title: 'Review cron job consolidation', completed: true, priority: 'medium', category: 'automation', timeEstimate: '1h' }
      ],
      Tuesday: [
        { id: '3', title: 'Set up S3 auto-archiver', completed: false, priority: 'high', category: 'automation', timeEstimate: '3h' },
        { id: '4', title: 'Test dashboard widgets', completed: false, priority: 'medium', category: 'review', timeEstimate: '1.5h' }
      ],
      Wednesday: [
        { id: '5', title: 'Integrate Claude exports', completed: false, priority: 'high', category: 'data', timeEstimate: '2h' },
        { id: '6', title: 'Update shortcut commands', completed: false, priority: 'low', category: 'automation', timeEstimate: '30m' }
      ],
      Thursday: [
        { id: '7', title: 'Run full data audit', completed: false, priority: 'high', category: 'data', timeEstimate: '4h' },
        { id: '8', title: 'Fix LinkedIn pipeline', completed: false, priority: 'medium', category: 'automation', timeEstimate: '2h' }
      ],
      Friday: [
        { id: '9', title: 'Generate weekly report', completed: false, priority: 'medium', category: 'review', timeEstimate: '1h' },
        { id: '10', title: 'Plan next week priorities', completed: false, priority: 'medium', category: 'planning', timeEstimate: '1h' }
      ],
      Saturday: [],
      Sunday: []
    };

    const plans: DayPlan[] = days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return {
        date,
        dayName: day,
        tasks: sampleTasks[day] || [],
        focusArea: focusAreas[index]
      };
    });

    setWeekPlans(plans);
  };

  const toggleTask = (dayIndex: number, taskId: string) => {
    setWeekPlans(prev => prev.map((day, i) => {
      if (i !== dayIndex) return day;
      return {
        ...day,
        tasks: day.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      };
    }));
  };

  const addTask = (dayIndex: number) => {
    const dayName = weekPlans[dayIndex].dayName;
    const taskTitle = newTaskInputs[dayName];
    if (!taskTitle?.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      completed: false,
      priority: 'medium',
      category: 'planning'
    };

    setWeekPlans(prev => prev.map((day, i) => {
      if (i !== dayIndex) return day;
      return { ...day, tasks: [...day.tasks, newTask] };
    }));

    setNewTaskInputs(prev => ({ ...prev, [dayName]: '' }));
    toast({
      title: "Task Added",
      description: `Added "${taskTitle}" to ${dayName}`,
    });
  };

  const deleteTask = (dayIndex: number, taskId: string) => {
    setWeekPlans(prev => prev.map((day, i) => {
      if (i !== dayIndex) return day;
      return { ...day, tasks: day.tasks.filter(t => t.id !== taskId) };
    }));
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return <Flag className="w-3 h-3 text-red-500" />;
      case 'medium': return <Flag className="w-3 h-3 text-yellow-500" />;
      case 'low': return <Flag className="w-3 h-3 text-blue-500" />;
    }
  };

  const getCategoryBadge = (category: Task['category']) => {
    const styles: Record<string, string> = {
      data: 'bg-blue-500/20 text-blue-400',
      automation: 'bg-purple-500/20 text-purple-400',
      review: 'bg-green-500/20 text-green-400',
      planning: 'bg-orange-500/20 text-orange-400'
    };
    return <Badge className={`text-xs ${styles[category]}`}>{category}</Badge>;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const totalTasks = weekPlans.reduce((acc, day) => acc + day.tasks.length, 0);
  const completedTasks = weekPlans.reduce((acc, day) => acc + day.tasks.filter(t => t.completed).length, 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getWeekRange = () => {
    if (weekPlans.length === 0) return '';
    const start = weekPlans[0].date;
    const end = weekPlans[6].date;
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Weekly Planner
            </CardTitle>
            <CardDescription>Plan your data consolidation tasks</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Progress Summary */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium">{completedTasks}/{totalTasks} tasks</div>
                <div className="text-xs text-muted-foreground">{completionRate}% complete</div>
              </div>
              <Progress value={completionRate} className="w-24 h-2" />
            </div>

            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeekOffset(prev => prev - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setWeekOffset(prev => prev + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">{getWeekRange()}</div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekPlans.map((day, dayIndex) => {
            const dayCompleted = day.tasks.filter(t => t.completed).length;
            const dayTotal = day.tasks.length;
            const isWeekend = dayIndex >= 5;

            return (
              <div
                key={day.dayName}
                className={`rounded-lg border ${
                  isToday(day.date)
                    ? 'border-primary bg-primary/5'
                    : isWeekend
                    ? 'border-border/50 bg-muted/20'
                    : 'border-border/50'
                }`}
              >
                {/* Day Header */}
                <div className={`p-3 border-b ${isToday(day.date) ? 'border-primary/30' : 'border-border/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold text-sm ${isToday(day.date) ? 'text-primary' : ''}`}>
                      {day.dayName.slice(0, 3)}
                    </span>
                    {isToday(day.date) && (
                      <Badge className="bg-primary/20 text-primary text-xs">Today</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.date.getDate()}
                  </div>
                  {day.focusArea && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {day.focusArea}
                    </div>
                  )}
                  {dayTotal > 0 && (
                    <div className="mt-2">
                      <Progress value={(dayCompleted / dayTotal) * 100} className="h-1" />
                    </div>
                  )}
                </div>

                {/* Tasks */}
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-2">
                    {day.tasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-2 rounded border text-xs ${
                          task.completed
                            ? 'bg-muted/30 border-border/30'
                            : 'bg-background border-border/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(dayIndex, task.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getPriorityIcon(task.priority)}
                              {getCategoryBadge(task.category)}
                              {task.timeEstimate && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.timeEstimate}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-50 hover:opacity-100"
                            onClick={() => deleteTask(dayIndex, task.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add Task Input */}
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Add task..."
                        value={newTaskInputs[day.dayName] || ''}
                        onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [day.dayName]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addTask(dayIndex)}
                        className="h-7 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addTask(dayIndex)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPlannerWidget;
