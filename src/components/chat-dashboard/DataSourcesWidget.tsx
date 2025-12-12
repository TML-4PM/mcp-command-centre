import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Database, Cloud, Globe, Zap, FileCode, HardDrive,
  CheckCircle, AlertCircle, RefreshCw, ExternalLink, Link2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataSource {
  id: string;
  name: string;
  type: 'cloud' | 'local' | 'api' | 'database';
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  itemCount: number;
  lastSync: Date | null;
  url?: string;
  coverage: number; // percentage of data recovered
  color: string;
}

interface DataSourcesWidgetProps {
  compact?: boolean;
}

const DataSourcesWidget = ({ compact = false }: DataSourcesWidgetProps) => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    // In production, fetch from a data_sources table
    // For now, mock the data sources based on context
    setSources([
      {
        id: 's3-intelligence',
        name: 'S3 Intelligence Dashboard',
        type: 'cloud',
        icon: <Cloud className="w-5 h-5" />,
        status: 'connected',
        itemCount: 26845,
        lastSync: new Date(Date.now() - 3600000),
        url: 'http://troy-intelligence-dashboard.s3-website-ap-southeast-2.amazonaws.com/',
        coverage: 85,
        color: 'orange'
      },
      {
        id: 'loveable',
        name: 'Loveable Projects',
        type: 'cloud',
        icon: <Globe className="w-5 h-5" />,
        status: 'connected',
        itemCount: 11505,
        lastSync: new Date(Date.now() - 1800000),
        url: 'https://loveable.dev',
        coverage: 92,
        color: 'pink'
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT Conversations',
        type: 'api',
        icon: <Zap className="w-5 h-5" />,
        status: 'syncing',
        itemCount: 23016,
        lastSync: new Date(),
        coverage: 78,
        color: 'green'
      },
      {
        id: 'claude',
        name: 'Claude Conversations',
        type: 'api',
        icon: <FileCode className="w-5 h-5" />,
        status: 'connected',
        itemCount: 15335,
        lastSync: new Date(Date.now() - 900000),
        coverage: 88,
        color: 'purple'
      },
      {
        id: 'supabase',
        name: 'Supabase Database',
        type: 'database',
        icon: <Database className="w-5 h-5" />,
        status: 'connected',
        itemCount: 76701,
        lastSync: new Date(),
        coverage: 100,
        color: 'blue'
      },
      {
        id: 'local-files',
        name: 'Local Files (MCP Bridge)',
        type: 'local',
        icon: <HardDrive className="w-5 h-5" />,
        status: 'connected',
        itemCount: 1247,
        lastSync: new Date(Date.now() - 7200000),
        url: 'file:///Users/troylatter/Documents/mcp_bridge/',
        coverage: 65,
        color: 'slate'
      }
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDataSources();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSync = async (sourceId: string) => {
    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, status: 'syncing' as const } : s
    ));

    // Simulate sync
    setTimeout(() => {
      setSources(prev => prev.map(s =>
        s.id === sourceId ? { ...s, status: 'connected' as const, lastSync: new Date() } : s
      ));
    }, 2000);
  };

  const getStatusBadge = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Connected</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Syncing</Badge>;
      case 'disconnected':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Offline</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
      pink: 'from-pink-500/10 to-pink-600/5 border-pink-500/20',
      green: 'from-green-500/10 to-green-600/5 border-green-500/20',
      purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
      blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
      slate: 'from-slate-500/10 to-slate-600/5 border-slate-500/20'
    };
    return colors[color] || colors.blue;
  };

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Sources
            </CardTitle>
            <Badge variant="outline">{sources.length} active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {sources.map(source => (
                <div
                  key={source.id}
                  className={`p-3 rounded-lg bg-gradient-to-br ${getColorClasses(source.color)} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-${source.color}-500`}>{source.icon}</div>
                    <div>
                      <div className="font-medium text-sm">{source.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {source.itemCount.toLocaleString()} items
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      source.status === 'connected' ? 'bg-green-500' :
                      source.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                      source.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Sources Registry
            </CardTitle>
            <CardDescription>All connected data sources and their sync status</CardDescription>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map(source => (
            <Card key={source.id} className={`bg-gradient-to-br ${getColorClasses(source.color)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-background/50`}>
                      {source.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{source.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{source.type}</div>
                    </div>
                  </div>
                  {source.url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(source.status)}
                    <span className="text-xl font-bold">{source.itemCount.toLocaleString()}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Data Coverage</span>
                      <span className="font-medium">{source.coverage}%</span>
                    </div>
                    <Progress value={source.coverage} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      Last sync: {source.lastSync?.toLocaleTimeString() || 'Never'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleSync(source.id)}
                      disabled={source.status === 'syncing'}
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${source.status === 'syncing' ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourcesWidget;
