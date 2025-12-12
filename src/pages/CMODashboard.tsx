import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Target,
  Users, Globe, Mail, Eye, MousePointer, DollarSign,
  Calendar, RefreshCw, ArrowUpRight, ArrowDownRight,
  Megaphone, Share2, Heart, MessageCircle, Zap, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart, Line
} from "recharts";

interface MarketingMetrics {
  reach: number;
  engagement: number;
  conversions: number;
  revenue: number;
  cac: number;
  ltv: number;
  roiPercentage: number;
}

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  channel: string;
  spend: number;
  reach: number;
  clicks: number;
  conversions: number;
  roi: number;
}

interface ChannelPerformance {
  channel: string;
  spend: number;
  revenue: number;
  roi: number;
  color: string;
}

const CMODashboard = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<MarketingMetrics>({
    reach: 0,
    engagement: 0,
    conversions: 0,
    revenue: 0,
    cac: 0,
    ltv: 0,
    roiPercentage: 0
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channelData, setChannelData] = useState<ChannelPerformance[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Generate mock marketing metrics
    setMetrics({
      reach: 2847000,
      engagement: 156000,
      conversions: 12847,
      revenue: 487500,
      cac: 28.50,
      ltv: 245.00,
      roiPercentage: 312
    });

    // Campaigns
    setCampaigns([
      { id: '1', name: 'Neural Ennead Launch', status: 'active', channel: 'LinkedIn', spend: 15000, reach: 450000, clicks: 23000, conversions: 1250, roi: 285 },
      { id: '2', name: 'WorkFamily AI Awareness', status: 'active', channel: 'Google Ads', spend: 25000, reach: 890000, clicks: 45000, conversions: 2100, roi: 340 },
      { id: '3', name: 'Tech4Humanity Summit', status: 'completed', channel: 'Events', spend: 8000, reach: 12000, clicks: 3500, conversions: 450, roi: 520 },
      { id: '4', name: 'AI Workforce Webinar Series', status: 'active', channel: 'Email', spend: 3500, reach: 125000, clicks: 18000, conversions: 890, roi: 445 },
      { id: '5', name: 'Partner Ecosystem Campaign', status: 'paused', channel: 'LinkedIn', spend: 12000, reach: 320000, clicks: 15000, conversions: 780, roi: 195 },
      { id: '6', name: 'Developer Community Growth', status: 'draft', channel: 'Twitter/X', spend: 0, reach: 0, clicks: 0, conversions: 0, roi: 0 },
    ]);

    // Channel performance
    setChannelData([
      { channel: 'LinkedIn', spend: 27000, revenue: 98000, roi: 263, color: '#0077b5' },
      { channel: 'Google Ads', spend: 25000, revenue: 110000, roi: 340, color: '#4285f4' },
      { channel: 'Email', spend: 3500, revenue: 19000, roi: 443, color: '#ea4335' },
      { channel: 'Events', spend: 8000, revenue: 49600, roi: 520, color: '#34a853' },
      { channel: 'Twitter/X', spend: 5000, revenue: 12000, roi: 140, color: '#1da1f2' },
      { channel: 'Content/SEO', spend: 4500, revenue: 45000, roi: 900, color: '#ff9900' },
    ]);

    // Weekly trend data
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
    setTrendData(weeks.map((week, i) => ({
      name: week,
      reach: Math.floor(300000 + Math.random() * 100000 + i * 20000),
      engagement: Math.floor(15000 + Math.random() * 8000 + i * 1500),
      conversions: Math.floor(1200 + Math.random() * 500 + i * 150),
      spend: Math.floor(8000 + Math.random() * 3000),
      revenue: Math.floor(50000 + Math.random() * 20000 + i * 5000)
    })));

    // Funnel data
    setFunnelData([
      { stage: 'Impressions', value: 2847000, color: '#3b82f6' },
      { stage: 'Reach', value: 1240000, color: '#8b5cf6' },
      { stage: 'Engagement', value: 156000, color: '#ec4899' },
      { stage: 'Clicks', value: 89000, color: '#f97316' },
      { stage: 'Leads', value: 24500, color: '#eab308' },
      { stage: 'Conversions', value: 12847, color: '#22c55e' },
    ]);

    setIsLoading(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      paused: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-blue-500/20 text-blue-400',
      draft: 'bg-gray-500/20 text-gray-400'
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary" />
            CMO Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Strategic Marketing Intelligence & Campaign Performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Calendar className="w-3 h-3" />
            Last 30 Days
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Eye className="w-5 h-5 text-blue-500" />
              <Badge className="bg-green-500/20 text-green-400">
                <ArrowUpRight className="w-3 h-3" />23%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatNumber(metrics.reach)}</div>
              <div className="text-xs text-muted-foreground">Total Reach</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Heart className="w-5 h-5 text-purple-500" />
              <Badge className="bg-green-500/20 text-green-400">
                <ArrowUpRight className="w-3 h-3" />18%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatNumber(metrics.engagement)}</div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-green-500" />
              <Badge className="bg-green-500/20 text-green-400">
                <ArrowUpRight className="w-3 h-3" />31%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatNumber(metrics.conversions)}</div>
              <div className="text-xs text-muted-foreground">Conversions</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <Badge className="bg-green-500/20 text-green-400">
                <ArrowUpRight className="w-3 h-3" />27%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-orange-500" />
              <Badge className="bg-red-500/20 text-red-400">
                <ArrowDownRight className="w-3 h-3" />8%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatCurrency(metrics.cac)}</div>
              <div className="text-xs text-muted-foreground">CAC</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Award className="w-5 h-5 text-cyan-500" />
              <Badge className="bg-green-500/20 text-green-400">
                <ArrowUpRight className="w-3 h-3" />15%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatCurrency(metrics.ltv)}</div>
              <div className="text-xs text-muted-foreground">LTV</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              <Badge className="bg-green-500/20 text-green-400">{metrics.roiPercentage}%</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{metrics.roiPercentage}%</div>
              <div className="text-xs text-muted-foreground">ROI</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="conversions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReach)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Channel Mix */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Channel ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="h-[250px] w-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="revenue"
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 flex-1 ml-4">
                    {channelData.map(channel => (
                      <div key={channel.channel} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                          <span className="text-sm">{channel.channel}</span>
                        </div>
                        <Badge variant="outline">{channel.roi}% ROI</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Campaigns Quick View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {campaigns.filter(c => c.status === 'active').map(campaign => (
                  <div key={campaign.id} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{campaign.name}</span>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Spend:</span>
                        <span className="ml-1 font-medium">{formatCurrency(campaign.spend)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ROI:</span>
                        <span className="ml-1 font-medium text-green-400">{campaign.roi}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reach:</span>
                        <span className="ml-1 font-medium">{formatNumber(campaign.reach)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conv:</span>
                        <span className="ml-1 font-medium">{formatNumber(campaign.conversions)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card border-b">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3">Campaign</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Spend</th>
                      <th className="p-3">Reach</th>
                      <th className="p-3">Clicks</th>
                      <th className="p-3">Conversions</th>
                      <th className="p-3">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(campaign => (
                      <tr key={campaign.id} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="p-3 font-medium">{campaign.name}</td>
                        <td className="p-3">{campaign.channel}</td>
                        <td className="p-3">{getStatusBadge(campaign.status)}</td>
                        <td className="p-3">{formatCurrency(campaign.spend)}</td>
                        <td className="p-3">{formatNumber(campaign.reach)}</td>
                        <td className="p-3">{formatNumber(campaign.clicks)}</td>
                        <td className="p-3">{formatNumber(campaign.conversions)}</td>
                        <td className="p-3">
                          <Badge className={campaign.roi > 200 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {campaign.roi}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelData.map(channel => (
              <Card key={channel.channel} style={{ borderColor: `${channel.color}30` }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: channel.color }} />
                      <span className="font-semibold">{channel.channel}</span>
                    </div>
                    <Badge style={{ backgroundColor: `${channel.color}20`, color: channel.color }}>
                      {channel.roi}% ROI
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spend</span>
                      <span className="font-medium">{formatCurrency(channel.spend)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium text-green-400">{formatCurrency(channel.revenue)}</span>
                    </div>
                    <Progress value={Math.min(channel.roi / 10, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Funnel</CardTitle>
              <CardDescription>Conversion flow from impressions to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, idx) => {
                  const prevValue = idx > 0 ? funnelData[idx - 1].value : stage.value;
                  const conversionRate = idx > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : '100';
                  const widthPercentage = (stage.value / funnelData[0].value) * 100;

                  return (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">{formatNumber(stage.value)}</span>
                          {idx > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {conversionRate}% conv
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-8 bg-muted/30 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${widthPercentage}%`,
                            backgroundColor: stage.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/30 text-center">
                <div className="text-sm text-muted-foreground mb-1">Overall Conversion Rate</div>
                <div className="text-3xl font-bold text-green-400">
                  {((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(2)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CMODashboard;
