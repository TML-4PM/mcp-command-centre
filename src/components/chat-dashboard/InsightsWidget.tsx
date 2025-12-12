import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity,
  Lightbulb, Target, Clock, Zap, Calendar, ArrowUpRight,
  ArrowDownRight, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell
} from "recharts";

interface Insight {
  id: string;
  type: 'trend' | 'alert' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  metric?: string;
  change?: number;
  priority: 'high' | 'medium' | 'low';
}

interface InsightsWidgetProps {
  expanded?: boolean;
}

const InsightsWidget = ({ expanded = false }: InsightsWidgetProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [sourceDistribution, setSourceDistribution] = useState<any[]>([]);

  useEffect(() => {
    generateInsights();
    generateChartData();
  }, []);

  const generateInsights = () => {
    setInsights([
      {
        id: '1',
        type: 'trend',
        title: 'Conversation Volume Up',
        description: 'Chat activity increased 23% this week compared to last week',
        metric: '23%',
        change: 23,
        priority: 'medium'
      },
      {
        id: '2',
        type: 'alert',
        title: 'Missing GPT Exports',
        description: '47 GPT conversations from Nov 15-20 not yet synced',
        metric: '47 chats',
        priority: 'high'
      },
      {
        id: '3',
        type: 'suggestion',
        title: 'Schedule Consolidation',
        description: 'Consider merging 3 duplicate cron jobs to reduce overhead',
        priority: 'medium'
      },
      {
        id: '4',
        type: 'achievement',
        title: 'Recovery Milestone',
        description: 'Successfully recovered 892 items this month - new record!',
        metric: '892 items',
        priority: 'low'
      },
      {
        id: '5',
        type: 'trend',
        title: 'Claude Usage Growing',
        description: 'Claude conversations now represent 35% of total, up from 20%',
        metric: '35%',
        change: 15,
        priority: 'medium'
      },
      {
        id: '6',
        type: 'alert',
        title: 'Storage Approaching Limit',
        description: 'S3 bucket at 78% capacity - consider archiving old data',
        metric: '78%',
        priority: 'high'
      }
    ]);
  };

  const generateChartData = () => {
    // Activity over time
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    setActivityData(days.map(day => ({
      name: day,
      conversations: Math.floor(Math.random() * 500) + 200,
      codeBlocks: Math.floor(Math.random() * 200) + 50,
      synced: Math.floor(Math.random() * 300) + 100
    })));

    // Source distribution
    setSourceDistribution([
      { name: 'ChatGPT', value: 30, color: '#10b981' },
      { name: 'Claude', value: 35, color: '#8b5cf6' },
      { name: 'Loveable', value: 15, color: '#ec4899' },
      { name: 'S3', value: 12, color: '#f97316' },
      { name: 'Local', value: 8, color: '#3b82f6' }
    ]);
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-purple-500" />;
      case 'achievement': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'trend': return 'border-blue-500/30 bg-blue-500/5';
      case 'alert': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'suggestion': return 'border-purple-500/30 bg-purple-500/5';
      case 'achievement': return 'border-green-500/30 bg-green-500/5';
    }
  };

  if (!expanded) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            <div className="space-y-3">
              {insights.slice(0, 4).map(insight => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-lg border ${getInsightStyle(insight.type)}`}
                >
                  <div className="flex items-start gap-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{insight.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {insight.description}
                      </div>
                      {insight.metric && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {insight.change !== undefined && (
                            insight.change > 0 ? (
                              <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                            )
                          )}
                          {insight.metric}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-blue-500" />
              <Badge className="bg-green-500/20 text-green-400">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">2,847</div>
              <div className="text-xs text-muted-foreground">Chats This Week</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-green-500" />
              <Badge className="bg-green-500/20 text-green-400">On Track</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-xs text-muted-foreground">Sync Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-purple-500" />
              <Badge variant="outline">Avg</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">24s</div>
              <div className="text-xs text-muted-foreground">Command Latency</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Zap className="w-5 h-5 text-orange-500" />
              <Badge className="bg-orange-500/20 text-orange-400">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                8%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">156</div>
              <div className="text-xs text-muted-foreground">Jobs Executed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Activity Trends
            </CardTitle>
            <CardDescription>Conversations and sync activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSynced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorConversations)"
                  />
                  <Area
                    type="monotone"
                    dataKey="synced"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorSynced)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Source Distribution
            </CardTitle>
            <CardDescription>Chat sources breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={sourceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {sourceDistribution.map(source => (
                  <div key={source.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-sm">{source.name}</span>
                    <span className="text-sm font-medium ml-auto">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>Actionable insights based on your data patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(insight => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${getInsightStyle(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-background/50">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{insight.title}</span>
                      <Badge variant="outline" className="capitalize text-xs">{insight.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.metric && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="bg-background/50">
                          {insight.change !== undefined && (
                            insight.change > 0 ? (
                              <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                            )
                          )}
                          {insight.metric}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsWidget;
