import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Upload, Search, AlertCircle, CheckCircle, Clock,
  FileSearch, RefreshCw, ArrowRight, Database, Cloud, HardDrive,
  FolderOpen, Eye, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MissingItem {
  id: string;
  title: string;
  type: 'conversation' | 'file' | 'report' | 'export';
  source: string;
  possibleLocation: string[];
  lastSeen: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'missing' | 'found' | 'recovering' | 'recovered';
}

interface RecoveryJob {
  id: string;
  source: string;
  target: string;
  progress: number;
  itemsRecovered: number;
  totalItems: number;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
}

const DataRecoveryWidget = () => {
  const { toast } = useToast();
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [recoveryJobs, setRecoveryJobs] = useState<RecoveryJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    fetchMissingItems();
    fetchRecoveryJobs();
  }, []);

  const fetchMissingItems = async () => {
    // Mock data - in production, query the database for orphaned references
    setMissingItems([
      {
        id: '1',
        title: 'MCP Integration Architecture Doc',
        type: 'file',
        source: 'S3',
        possibleLocation: ['troy-intelligence-dashboard', 'mcp_bridge/exports'],
        lastSeen: new Date(Date.now() - 86400000 * 3),
        priority: 'high',
        status: 'missing'
      },
      {
        id: '2',
        title: 'GPT Conversation - Agent Framework Design',
        type: 'conversation',
        source: 'ChatGPT',
        possibleLocation: ['conversations table', 'gpt_exports folder'],
        lastSeen: new Date(Date.now() - 86400000 * 7),
        priority: 'high',
        status: 'found'
      },
      {
        id: '3',
        title: 'Weekly Analytics Report - Nov 2024',
        type: 'report',
        source: 'Lambda',
        possibleLocation: ['S3 reports bucket', 'local Downloads'],
        lastSeen: new Date(Date.now() - 86400000 * 30),
        priority: 'medium',
        status: 'recovering'
      },
      {
        id: '4',
        title: 'Claude Conversation Batch Export',
        type: 'export',
        source: 'Claude',
        possibleLocation: ['~/Downloads', 'claude_exports'],
        lastSeen: new Date(Date.now() - 86400000 * 14),
        priority: 'medium',
        status: 'missing'
      },
      {
        id: '5',
        title: 'Partner Health Dashboard Data',
        type: 'file',
        source: 'Loveable',
        possibleLocation: ['Supabase', 'project exports'],
        lastSeen: new Date(Date.now() - 86400000 * 5),
        priority: 'low',
        status: 'recovered'
      }
    ]);
  };

  const fetchRecoveryJobs = async () => {
    setRecoveryJobs([
      {
        id: 'job1',
        source: 'S3 Intelligence Dashboard',
        target: 'Supabase conversations',
        progress: 78,
        itemsRecovered: 892,
        totalItems: 1143,
        status: 'running',
        startedAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'job2',
        source: 'Local MCP Bridge',
        target: 'S3 Archive',
        progress: 100,
        itemsRecovered: 245,
        totalItems: 245,
        status: 'completed',
        startedAt: new Date(Date.now() - 7200000)
      }
    ]);
  };

  const startFullScan = async () => {
    setIsScanning(true);
    toast({
      title: "Starting Full Scan",
      description: "Scanning all data sources for missing items...",
    });

    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Scan Complete",
        description: "Found 23 potentially recoverable items",
      });
    }, 3000);
  };

  const recoverItem = async (item: MissingItem) => {
    setMissingItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'recovering' as const } : i
    ));

    toast({
      title: `Recovering ${item.title}`,
      description: `Searching in ${item.possibleLocation.join(', ')}...`,
    });

    setTimeout(() => {
      setMissingItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'recovered' as const } : i
      ));
      toast({
        title: "Recovery Complete",
        description: `${item.title} has been recovered`,
      });
    }, 2500);
  };

  const getStatusIcon = (status: MissingItem['status']) => {
    switch (status) {
      case 'missing': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'found': return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'recovering': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'recovered': return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getPriorityBadge = (priority: MissingItem['priority']) => {
    const styles: Record<string, string> = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return <Badge className={styles[priority]}>{priority}</Badge>;
  };

  const filteredItems = missingItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSource === 'all' || item.source.toLowerCase() === filterSource.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const uniqueSources = [...new Set(missingItems.map(i => i.source))];
  const missingCount = missingItems.filter(i => i.status === 'missing').length;
  const recoveredCount = missingItems.filter(i => i.status === 'recovered').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <Badge variant="destructive">{missingCount}</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{missingCount}</div>
              <div className="text-xs text-muted-foreground">Missing Items</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Eye className="w-5 h-5 text-yellow-500" />
              <Badge className="bg-yellow-500/20 text-yellow-400">{missingItems.filter(i => i.status === 'found').length}</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{missingItems.filter(i => i.status === 'found').length}</div>
              <div className="text-xs text-muted-foreground">Found</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              <Badge className="bg-blue-500/20 text-blue-400">{recoveryJobs.filter(j => j.status === 'running').length}</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{recoveryJobs.filter(j => j.status === 'running').length}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <Badge className="bg-green-500/20 text-green-400">{recoveredCount}</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{recoveredCount}</div>
              <div className="text-xs text-muted-foreground">Recovered</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Recovery Jobs */}
      {recoveryJobs.filter(j => j.status === 'running').length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              Active Recovery Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recoveryJobs.filter(j => j.status === 'running').map(job => (
                <div key={job.id} className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      <span className="font-medium">{job.source}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Database className="w-4 h-4" />
                      <span className="font-medium">{job.target}</span>
                    </div>
                    <span className="text-sm font-medium">{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{job.itemsRecovered.toLocaleString()} / {job.totalItems.toLocaleString()} items</span>
                    <span>Started {job.startedAt.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Items List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-primary" />
                Data Recovery Center
              </CardTitle>
              <CardDescription>Find and recover missing chats, files, and reports</CardDescription>
            </div>
            <Button onClick={startFullScan} disabled={isScanning}>
              {isScanning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isScanning ? 'Scanning...' : 'Full Scan'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search missing items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map(source => (
                  <SelectItem key={source} value={source.toLowerCase()}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    item.status === 'recovered' ? 'bg-green-500/5 border-green-500/20' :
                    item.status === 'recovering' ? 'bg-blue-500/5 border-blue-500/20' :
                    item.status === 'found' ? 'bg-yellow-500/5 border-yellow-500/20' :
                    'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="capitalize">{item.type}</span> from <span className="font-medium">{item.source}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Possible locations: {item.possibleLocation.join(' • ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getPriorityBadge(item.priority)}
                      {item.status !== 'recovered' && (
                        <Button
                          size="sm"
                          variant={item.status === 'recovering' ? 'outline' : 'default'}
                          onClick={() => recoverItem(item)}
                          disabled={item.status === 'recovering'}
                        >
                          {item.status === 'recovering' ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Recovering
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3 mr-1" />
                              Recover
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataRecoveryWidget;
