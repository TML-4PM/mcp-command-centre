import { useState, useEffect } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Network, BarChart3, TrendingUp, Activity, Target,
  ChevronRight, ChevronDown, Search, Filter, RefreshCw,
  Building2, Briefcase, User, Star, AlertCircle, CheckCircle,
  Zap, Clock, Award, MessageSquare, FileCode, GitBranch
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Neural Ennead Structure: 9 Divisions × 9 Teams × 9 Workers = 729
interface Worker {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  division: string;
  team: string;
  output: number;
  tasks_completed: number;
  efficiency: number;
  specialization: string;
  last_active: Date;
}

interface Team {
  id: string;
  name: string;
  division: string;
  workers: Worker[];
  health: number;
  output: number;
  lead?: string;
}

interface Division {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  teams: Team[];
  health: number;
  output: number;
  director?: string;
}

// The 9 Divisions of the Neural Ennead
const DIVISIONS = [
  { id: 'strategy', name: 'Strategy & Vision', icon: <Target className="w-5 h-5" />, color: 'blue' },
  { id: 'engineering', name: 'Engineering', icon: <FileCode className="w-5 h-5" />, color: 'green' },
  { id: 'data', name: 'Data & Analytics', icon: <BarChart3 className="w-5 h-5" />, color: 'purple' },
  { id: 'operations', name: 'Operations', icon: <Activity className="w-5 h-5" />, color: 'orange' },
  { id: 'creative', name: 'Creative & Content', icon: <Star className="w-5 h-5" />, color: 'pink' },
  { id: 'marketing', name: 'Marketing & Growth', icon: <TrendingUp className="w-5 h-5" />, color: 'cyan' },
  { id: 'support', name: 'Support & Success', icon: <MessageSquare className="w-5 h-5" />, color: 'yellow' },
  { id: 'research', name: 'R&D Innovation', icon: <Zap className="w-5 h-5" />, color: 'indigo' },
  { id: 'governance', name: 'Governance & Compliance', icon: <Building2 className="w-5 h-5" />, color: 'slate' },
];

// Team names for each division (9 teams per division)
const TEAM_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
  'Zeta', 'Eta', 'Theta', 'Iota'
];

const WorkerDashboard = () => {
  const { toast } = useToast();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'org' | 'list'>('grid');
  const [dataSource, setDataSource] = useState<'mock' | 'supabase'>('mock');
  const [supabaseWorkerCount, setSupabaseWorkerCount] = useState<number>(0);

  useEffect(() => {
    loadWorkerData();
  }, []);

  // Try to load from Supabase first, fall back to mock data
  const loadWorkerData = async () => {
    setIsLoading(true);

    try {
      // Try bridge first — neural_ennead_members is the real data
      try {
        const ennead = await bridgeSQL("SELECT id, name, role, family, division, status, efficiency, tasks_completed, specialization FROM neural_ennead_members ORDER BY family, division, name LIMIT 729");
        if (ennead.rows && ennead.rows.length > 0) {
          setDataSource('supabase');
          setSupabaseWorkerCount(ennead.rows.length);
          transformSupabaseToNeuralEnnead(ennead.rows);
          setIsLoading(false);
          return;
        }
      } catch (bridgeErr) {
        console.warn('Bridge fetch failed, trying Supabase:', bridgeErr);
      }

      // Supabase fallback
      const { data: workersData, error: workersError, count: workersCount } = await supabase
        .from('neural_ennead_members')
        .select('*', { count: 'exact' })
        .limit(729);

      if (!workersError && workersData && workersData.length > 0) {
        setDataSource('supabase');
        setSupabaseWorkerCount(workersCount || workersData.length);
        transformSupabaseToNeuralEnnead(workersData);
        return;
      }

      // Fall back to generated data
      console.log('No ennead data available, generating');
      generateNeuralEnnead();
    } catch (error) {
      console.error('Error loading worker data:', error);
      generateNeuralEnnead();
    }
  };

  // Transform Supabase data into Neural Ennead structure
  const transformSupabaseToNeuralEnnead = (data: any[]) => {
    // Group workers by division - map asset_name to divisions for 4500 roles format
    const workersByDivision = new Map<string, any[]>();

    // Map asset_names to Neural Ennead divisions
    const assetToDivision: Record<string, string> = {
      'Identity & Sticker': 'strategy',
      'Bio / Origin': 'research',
      'Key Works / Principles / Process': 'engineering',
      'Timeline & Influence': 'operations',
      'Applications & Domains': 'data',
    };

    // Map variant_name to efficiency scores
    const variantToEfficiency: Record<string, number> = {
      'Novice': 40,
      'Practitioner': 55,
      'Expert': 70,
      'Leader': 85,
      'Augmented': 95,
    };

    // Map signal_state to status
    const signalToStatus: Record<string, Worker['status']> = {
      'none': 'offline',
      'weak': 'idle',
      'moderate': 'busy',
      'strong': 'active',
      'embedded': 'active',
    };

    data.forEach((item, idx) => {
      // Handle 4500 roles format
      let divisionKey: string;
      if (item.asset_name) {
        divisionKey = assetToDivision[item.asset_name] || DIVISIONS[idx % 9].id;
      } else {
        divisionKey = item.division || item.department || DIVISIONS[idx % 9].id;
      }

      if (!workersByDivision.has(divisionKey)) {
        workersByDivision.set(divisionKey, []);
      }
      workersByDivision.get(divisionKey)!.push(item);
    });

    const generatedDivisions: Division[] = DIVISIONS.map((div, divIdx) => {
      const divisionWorkers = workersByDivision.get(div.id) || [];

      // Split workers into teams (max 9 per team)
      const teams: Team[] = TEAM_NAMES.map((teamName, teamIdx) => {
        const teamStart = teamIdx * 9;
        const teamWorkers = divisionWorkers.slice(teamStart, teamStart + 9);

        const workers: Worker[] = teamWorkers.length > 0
          ? teamWorkers.map((w, workerIdx) => ({
              id: w.id || `${div.id}-${teamIdx}-${workerIdx}`,
              // Map 4500 roles format: exemplar + variant_name
              name: w.exemplar
                ? `${w.exemplar} (${w.variant_name || 'Worker'})`
                : w.name || w.title || w.role_name || `Worker-${workerIdx + 1}`,
              role: w.variant_name || w.role || w.title || w.specialization || 'Worker',
              // Map signal_state to status
              status: w.signal_state
                ? (signalToStatus[w.signal_state] || 'active')
                : (w.status || 'active') as Worker['status'],
              division: div.id,
              team: `${div.id}-${teamName}`,
              // Use ai_trajectory_score for output
              output: w.ai_trajectory_score || w.output || Math.floor(Math.random() * 100) + 50,
              tasks_completed: w.tasks_completed || Math.floor(Math.random() * 500),
              // Map variant_name to efficiency
              efficiency: w.variant_name
                ? (variantToEfficiency[w.variant_name] || 60)
                : w.efficiency || Math.floor(Math.random() * 40) + 60,
              // Use asset_name or velocity as specialization
              specialization: w.asset_name || w.velocity || w.specialization || w.role || 'General',
              last_active: w.last_active ? new Date(w.last_active) : new Date()
            }))
          : Array.from({ length: 9 }, (_, workerIdx) => generateMockWorker(div.id, teamName, teamIdx, workerIdx, divIdx));

        const teamHealth = Math.round(workers.reduce((sum, w) => sum + w.efficiency, 0) / workers.length);
        const teamOutput = workers.reduce((sum, w) => sum + w.output, 0);

        return {
          id: `${div.id}-${teamName}`,
          name: `${teamName} Team`,
          division: div.id,
          workers,
          health: teamHealth,
          output: teamOutput,
          lead: workers[0]?.name
        };
      });

      const divHealth = Math.round(teams.reduce((sum, t) => sum + t.health, 0) / teams.length);
      const divOutput = teams.reduce((sum, t) => sum + t.output, 0);

      return {
        id: div.id,
        name: div.name,
        icon: div.icon,
        color: div.color,
        teams,
        health: divHealth,
        output: divOutput,
        director: `Director-${divIdx + 1}`
      };
    });

    setDivisions(generatedDivisions);
    setIsLoading(false);
  };

  const generateMockWorker = (divId: string, teamName: string, teamIdx: number, workerIdx: number, divIdx: number): Worker => {
    const statuses: Worker['status'][] = ['active', 'active', 'active', 'busy', 'busy', 'idle', 'idle', 'offline', 'active'];
    const specializations = [
      'AI Agent', 'Data Processor', 'API Handler', 'Content Creator',
      'Analyzer', 'Optimizer', 'Coordinator', 'Researcher', 'Validator'
    ];
    return {
      id: `${divId}-${teamIdx}-${workerIdx}`,
      name: `Worker-${(divIdx * 81) + (teamIdx * 9) + workerIdx + 1}`,
      role: specializations[workerIdx],
      status: statuses[workerIdx],
      division: divId,
      team: `${divId}-${teamName}`,
      output: Math.floor(Math.random() * 100) + 50,
      tasks_completed: Math.floor(Math.random() * 500) + 100,
      efficiency: Math.floor(Math.random() * 40) + 60,
      specialization: specializations[workerIdx],
      last_active: new Date(Date.now() - Math.random() * 86400000)
    };
  };

  // Generate the 9×9×9 Neural Ennead structure
  const generateNeuralEnnead = () => {
    const generatedDivisions: Division[] = DIVISIONS.map((div, divIdx) => {
      const teams: Team[] = TEAM_NAMES.map((teamName, teamIdx) => {
        const workers: Worker[] = Array.from({ length: 9 }, (_, workerIdx) => {
          const workerId = `${div.id}-${teamIdx}-${workerIdx}`;
          const statuses: Worker['status'][] = ['active', 'active', 'active', 'busy', 'busy', 'idle', 'idle', 'offline', 'active'];
          const specializations = [
            'AI Agent', 'Data Processor', 'API Handler', 'Content Creator',
            'Analyzer', 'Optimizer', 'Coordinator', 'Researcher', 'Validator'
          ];

          return {
            id: workerId,
            name: `Worker-${(divIdx * 81) + (teamIdx * 9) + workerIdx + 1}`,
            role: specializations[workerIdx],
            status: statuses[workerIdx],
            division: div.id,
            team: `${div.id}-${teamName}`,
            output: Math.floor(Math.random() * 100) + 50,
            tasks_completed: Math.floor(Math.random() * 500) + 100,
            efficiency: Math.floor(Math.random() * 40) + 60,
            specialization: specializations[workerIdx],
            last_active: new Date(Date.now() - Math.random() * 86400000)
          };
        });

        const teamHealth = Math.round(workers.reduce((sum, w) => sum + w.efficiency, 0) / workers.length);
        const teamOutput = workers.reduce((sum, w) => sum + w.output, 0);

        return {
          id: `${div.id}-${teamName}`,
          name: `${teamName} Team`,
          division: div.id,
          workers,
          health: teamHealth,
          output: teamOutput,
          lead: workers[0].name
        };
      });

      const divHealth = Math.round(teams.reduce((sum, t) => sum + t.health, 0) / teams.length);
      const divOutput = teams.reduce((sum, t) => sum + t.output, 0);

      return {
        id: div.id,
        name: div.name,
        icon: div.icon,
        color: div.color,
        teams,
        health: divHealth,
        output: divOutput,
        director: `Director-${divIdx + 1}`
      };
    });

    setDivisions(generatedDivisions);
    setIsLoading(false);
  };

  const toggleDivision = (divId: string) => {
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divId)) {
        newSet.delete(divId);
      } else {
        newSet.add(divId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: Worker['status']) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      busy: 'bg-blue-500/20 text-blue-400',
      idle: 'bg-yellow-500/20 text-yellow-400',
      offline: 'bg-gray-500/20 text-gray-400'
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const getDivisionColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
      green: 'from-green-500/10 to-green-600/5 border-green-500/20',
      purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
      orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
      pink: 'from-pink-500/10 to-pink-600/5 border-pink-500/20',
      cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
      yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
      indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20',
      slate: 'from-slate-500/10 to-slate-600/5 border-slate-500/20'
    };
    return colors[color] || colors.blue;
  };

  // Calculate totals
  const totalWorkers = divisions.reduce((sum, d) => sum + d.teams.reduce((ts, t) => ts + t.workers.length, 0), 0);
  const activeWorkers = divisions.reduce((sum, d) =>
    sum + d.teams.reduce((ts, t) =>
      ts + t.workers.filter(w => w.status === 'active' || w.status === 'busy').length, 0), 0);
  const totalOutput = divisions.reduce((sum, d) => sum + d.output, 0);
  const avgHealth = Math.round(divisions.reduce((sum, d) => sum + d.health, 0) / divisions.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Network className="w-8 h-8 text-primary" />
            Neural Ennead
          </h1>
          <p className="text-muted-foreground mt-1">
            9×9×9 Workforce Management • {totalWorkers} Workers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant={dataSource === 'supabase' ? 'default' : 'outline'} className="gap-1">
            {dataSource === 'supabase' ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Supabase ({supabaseWorkerCount})
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Mock Data
              </>
            )}
          </Badge>
          <Button variant="outline" size="icon" onClick={loadWorkerData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-blue-500" />
              <Badge variant="outline">Total</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{totalWorkers}</div>
              <div className="text-xs text-muted-foreground">Workers</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-green-500" />
              <Badge className="bg-green-500/20 text-green-400">{Math.round(activeWorkers/totalWorkers*100)}%</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{activeWorkers}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="w-5 h-5 text-purple-500" />
              <Badge variant="outline">9</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">9</div>
              <div className="text-xs text-muted-foreground">Divisions</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Briefcase className="w-5 h-5 text-orange-500" />
              <Badge variant="outline">81</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">81</div>
              <div className="text-xs text-muted-foreground">Teams</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
              <Badge className="bg-cyan-500/20 text-cyan-400">+12%</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{totalOutput.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Output</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Award className="w-5 h-5 text-pink-500" />
              <Badge className="bg-pink-500/20 text-pink-400">{avgHealth}%</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{avgHealth}%</div>
              <div className="text-xs text-muted-foreground">Avg Health</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="divisions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="workers">All Workers</TabsTrigger>
          <TabsTrigger value="org-chart">Org Chart</TabsTrigger>
        </TabsList>

        {/* Divisions View */}
        <TabsContent value="divisions" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {divisions.map(division => (
              <Card
                key={division.id}
                className={`bg-gradient-to-br ${getDivisionColorClasses(division.color)} cursor-pointer hover:scale-[1.02] transition-transform`}
                onClick={() => toggleDivision(division.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${division.color}-500/20`}>
                        {division.icon}
                      </div>
                      <div>
                        <div className="font-semibold">{division.name}</div>
                        <div className="text-xs text-muted-foreground">{division.director}</div>
                      </div>
                    </div>
                    {expandedDivisions.has(division.id) ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold">{division.teams.length}</div>
                      <div className="text-xs text-muted-foreground">Teams</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {division.teams.reduce((sum, t) => sum + t.workers.length, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Workers</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{division.health}%</div>
                      <div className="text-xs text-muted-foreground">Health</div>
                    </div>
                  </div>

                  <Progress value={division.health} className="h-1.5 mt-3" />

                  {/* Expanded Team List */}
                  {expandedDivisions.has(division.id) && (
                    <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                      {division.teams.map(team => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-2 rounded bg-background/50"
                        >
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{team.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {team.workers.length} workers
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${
                              team.health >= 80 ? 'bg-green-500' :
                              team.health >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Teams View */}
        <TabsContent value="teams" className="space-y-4 mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {divisions.flatMap(d => d.teams).map(team => (
                <Card key={team.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{team.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{team.division}</Badge>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      {team.workers.map(worker => (
                        <div
                          key={worker.id}
                          className={`w-2 h-2 rounded-full ${getStatusColor(worker.status)}`}
                          title={`${worker.name}: ${worker.status}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{team.workers.length} workers</span>
                      <span>Health: {team.health}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Workers View */}
        <TabsContent value="workers" className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card border-b">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3">Worker</th>
                      <th className="p-3">Division</th>
                      <th className="p-3">Team</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Efficiency</th>
                      <th className="p-3">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divisions.flatMap(d => d.teams.flatMap(t => t.workers))
                      .filter(w => filterStatus === 'all' || w.status === filterStatus)
                      .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   w.role.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 100)
                      .map(worker => (
                        <tr key={worker.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{worker.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{worker.division}</td>
                          <td className="p-3 text-sm">{worker.team.split('-').pop()}</td>
                          <td className="p-3">{getStatusBadge(worker.status)}</td>
                          <td className="p-3 text-sm text-muted-foreground">{worker.role}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Progress value={worker.efficiency} className="w-16 h-1.5" />
                              <span className="text-xs">{worker.efficiency}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm font-medium">{worker.output}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Org Chart View */}
        <TabsContent value="org-chart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Neural Ennead Hierarchy
              </CardTitle>
              <CardDescription>9 Divisions × 9 Teams × 9 Workers = 729 Total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {/* CEO Level */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mb-4">
                  <div className="text-center">
                    <Award className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <div className="font-bold">Chief Executive</div>
                    <div className="text-xs text-muted-foreground">Neural Ennead Command</div>
                  </div>
                </div>

                {/* Division Level */}
                <div className="w-full flex justify-center mb-4">
                  <div className="h-8 w-px bg-border" />
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {divisions.map(div => (
                    <div
                      key={div.id}
                      className={`p-3 rounded-lg bg-gradient-to-br ${getDivisionColorClasses(div.color)} text-center min-w-[100px]`}
                    >
                      <div className="mb-1">{div.icon}</div>
                      <div className="text-xs font-medium">{div.name.split(' ')[0]}</div>
                      <div className="text-xs text-muted-foreground">81 workers</div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 p-4 rounded-lg bg-muted/30 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Organization Structure</div>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">9</div>
                      <div className="text-xs text-muted-foreground">Divisions</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold text-primary">81</div>
                      <div className="text-xs text-muted-foreground">Teams</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold text-primary">729</div>
                      <div className="text-xs text-muted-foreground">Workers</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkerDashboard;
