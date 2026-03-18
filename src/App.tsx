import { Suspense, lazy, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import StatusBar from "./components/StatusBar";
import { Loader2 } from "lucide-react";
import { emitRouteEnter, emitRouteComplete } from "@/lib/aiops/emitter";

// Eager load Overview (landing page)
import MCPCommandCentre from "./pages/MCPCommandCentre";

// Lazy load everything else
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Search = lazy(() => import("./pages/Search"));
const Commands = lazy(() => import("./pages/Commands"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Outreach = lazy(() => import("./pages/Outreach"));
const SQLQueries = lazy(() => import("./pages/SQLQueries"));
const Infra = lazy(() => import("./pages/Infra"));
const Assets = lazy(() => import("./pages/Assets"));
const Finance = lazy(() => import("./pages/Finance"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ChatDashboard = lazy(() => import("./pages/ChatDashboard"));
const WorkerDashboard = lazy(() => import("./pages/WorkerDashboard"));
const CMODashboard = lazy(() => import("./pages/CMODashboard"));
const MaatSystem = lazy(() => import("./pages/MaatSystem"));
const Grants = lazy(() => import("./pages/Grants"));
const RnD = lazy(() => import("./pages/RnD"));
const Businesses = lazy(() => import("./pages/Businesses"));
const NeuralEnnead = lazy(() => import("./pages/NeuralEnnead"));
const Agents = lazy(() => import("./pages/Agents"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AppConsole = lazy(() => import("./pages/AppConsole"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Content = lazy(() => import("./pages/Content"));
const Crawler = lazy(() => import("./pages/Crawler"));
const Customers = lazy(() => import("./pages/Customers"));
const Health = lazy(() => import("./pages/Health"));
const Hob = lazy(() => import("./pages/Hob"));
const IpPortfolio = lazy(() => import("./pages/IpPortfolio"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Metrics = lazy(() => import("./pages/Metrics"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Products = lazy(() => import("./pages/Products"));
const Signals = lazy(() => import("./pages/Signals"));
const Systems = lazy(() => import("./pages/Systems"));
const Tax = lazy(() => import("./pages/Tax"));
const Tools = lazy(() => import("./pages/Tools"));
const PortfolioSurface = lazy(() => import("./pages/PortfolioSurface"));
const LoopOS = lazy(() => import("./pages/LoopOS"));
const Patterns = lazy(() => import("./pages/Patterns"));
const PlmosProducts = lazy(() => import("./pages/PlmosProducts"));
const Dogfood = lazy(() => import("./pages/Dogfood"));
const Dossier = lazy(() => import("./pages/Dossier"));
const Connections = lazy(() => import("./pages/Connections"));
const Mcp = lazy(() => import("./pages/Mcp"));
const Growth = lazy(() => import("./pages/Growth"));
const MissionControl = lazy(() => import("./pages/MissionControl"));
const Governance = lazy(() => import("./pages/Governance"));
const CapStore = lazy(() => import("./pages/CapStore"));
const ExecSpine = lazy(() => import("./pages/ExecSpine"));
const PostExec = lazy(() => import("./pages/PostExec"));
const AccountantPage = lazy(() => import("./pages/AccountantPage"));
const Octoparse = lazy(() => import("./pages/Octoparse"));
const AgentCapacity = lazy(() => import("./pages/AgentCapacity"));
const AgentOps = lazy(() => import("./pages/AgentOps"));
const AgoeGovernance = lazy(() => import("./pages/AgoeGovernance"));
const AutonomousEngine = lazy(() => import("./pages/AutonomousEngine"));
const Autonomy = lazy(() => import("./pages/Autonomy"));
const Basiq = lazy(() => import("./pages/Basiq"));
const Boardroom = lazy(() => import("./pages/Boardroom"));
const BridgeTerminal = lazy(() => import("./pages/BridgeTerminal"));
const Campaign = lazy(() => import("./pages/Campaign"));
const CloudMigration = lazy(() => import("./pages/CloudMigration"));
const Comet = lazy(() => import("./pages/Comet"));
const Crm = lazy(() => import("./pages/Crm"));
const Dsr = lazy(() => import("./pages/Dsr"));
const GtmControl = lazy(() => import("./pages/GtmControl"));
const HoloCrm = lazy(() => import("./pages/HoloCrm"));
const HoloorgEconomy = lazy(() => import("./pages/HoloorgEconomy"));
const HoloorgFleet = lazy(() => import("./pages/HoloorgFleet"));
const HoloorgSchema = lazy(() => import("./pages/HoloorgSchema"));
const HoloorgTasks = lazy(() => import("./pages/HoloorgTasks"));
const InsightOs = lazy(() => import("./pages/InsightOs"));
const IpResearch = lazy(() => import("./pages/IpResearch"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Lcd = lazy(() => import("./pages/Lcd"));
const Leads = lazy(() => import("./pages/Leads"));
const Level15 = lazy(() => import("./pages/Level15"));
const Level23 = lazy(() => import("./pages/Level23"));
const Linkedin = lazy(() => import("./pages/Linkedin"));
const LinkedinContent = lazy(() => import("./pages/LinkedinContent"));
const LivingCells = lazy(() => import("./pages/LivingCells"));
const LivingCompany = lazy(() => import("./pages/LivingCompany"));
const MaatSources = lazy(() => import("./pages/MaatSources"));
const Narrative = lazy(() => import("./pages/Narrative"));
const Orchestrator = lazy(() => import("./pages/Orchestrator"));
const Overview = lazy(() => import("./pages/Overview"));
const OzbridgeSwarm = lazy(() => import("./pages/OzbridgeSwarm"));
const Pel = lazy(() => import("./pages/Pel"));
const PortfolioForensic = lazy(() => import("./pages/PortfolioForensic"));
const ProductFlywheel = lazy(() => import("./pages/ProductFlywheel"));
const RdtiCorpus = lazy(() => import("./pages/RdtiCorpus"));
const ReportFactory = lazy(() => import("./pages/ReportFactory"));
const Revenue = lazy(() => import("./pages/Revenue"));
const RocketControl = lazy(() => import("./pages/RocketControl"));
const Scout = lazy(() => import("./pages/Scout"));
const SellLoop = lazy(() => import("./pages/SellLoop"));
const SpineOps = lazy(() => import("./pages/SpineOps"));
const ThrivingKids = lazy(() => import("./pages/ThrivingKids"));
const Trojanoz = lazy(() => import("./pages/Trojanoz"));
const Watchdog = lazy(() => import("./pages/Watchdog"));
const WorkfamilyPlatform = lazy(() => import("./pages/WorkfamilyPlatform"));
const Webops = lazy(() => import("./pages/Webops"));
const Maat121Spine = lazy(() => import("./pages/Maat121Spine"));


const queryClient = new QueryClient();

/** AIOps — emit flow events on every route change */
const RouteTracker = () => {
  const { pathname } = useLocation();
  const flowRef = useRef<{ id: string; ts: number } | null>(null);

  useEffect(() => {
    // Complete previous route flow
    if (flowRef.current) {
      emitRouteComplete(
        flowRef.current.id,
        pathname,
        Date.now() - flowRef.current.ts
      );
    }
    // Start new route flow
    const flowId = emitRouteEnter(pathname);
    flowRef.current = { id: flowId, ts: Date.now() };
  }, [pathname]);

  return null;
};

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-3" />
    <span className="text-slate-400">Loading...</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteTracker />
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
          <ErrorBoundary fallbackTitle="Page crashed">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<MCPCommandCentre />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/businesses" element={<Businesses />} />
                <Route path="/systems" element={<Systems />} />
                <Route path="/architecture" element={<Architecture />} />
                <Route path="/products" element={<Products />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/crawler" element={<Crawler />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/content" element={<Content />} />
                <Route path="/hob" element={<Hob />} />
                <Route path="/maat" element={<MaatSystem />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/grants" element={<Grants />} />
                <Route path="/rd" element={<RnD />} />
                <Route path="/tax" element={<Tax />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/ip" element={<IpPortfolio />} />
                <Route path="/ennead" element={<NeuralEnnead />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/workers" element={<WorkerDashboard />} />
                <Route path="/health" element={<Health />} />
                <Route path="/signals" element={<Signals />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/metrics" element={<Metrics />} />
                <Route path="/cmo" element={<CMODashboard />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/search" element={<Search />} />
                <Route path="/outreach" element={<Outreach />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio-surface" element={<PortfolioSurface />} />
                <Route path="/loop-os" element={<LoopOS />} />
                <Route path="/infra" element={<Infra />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/apps" element={<AppConsole />} />
                <Route path="/sql-queries" element={<SQLQueries />} />
                <Route path="/chat-ops" element={<ChatDashboard />} />
                <Route path="/commands" element={<Commands />} />
                <Route path="/patterns" element={<Patterns />} />
                <Route path="/plmos" element={<PlmosProducts />} />
                <Route path="/mission-control" element={<MissionControl />} />
                <Route path="/governance" element={<Governance />} />
                <Route path="/exec-spine" element={<ExecSpine />} />
                <Route path="/post-exec" element={<PostExec />} />
                <Route path="/accountant" element={<AccountantPage />} />

                <Route path="/cap-store" element={<CapStore />} />
                                <Route path="/agent-capacity" element={<AgentCapacity />} />
                <Route path="/agent-ops" element={<AgentOps />} />
                <Route path="/agoe-governance" element={<AgoeGovernance />} />
                <Route path="/autonomous-engine" element={<AutonomousEngine />} />
                <Route path="/autonomy" element={<Autonomy />} />
                <Route path="/basiq" element={<Basiq />} />
                <Route path="/boardroom" element={<Boardroom />} />
                <Route path="/bridge-terminal" element={<BridgeTerminal />} />
                <Route path="/campaign" element={<Campaign />} />
                <Route path="/cloud-migration" element={<CloudMigration />} />
                <Route path="/comet" element={<Comet />} />
                <Route path="/crm" element={<Crm />} />
                <Route path="/dsr" element={<Dsr />} />
                <Route path="/gtm-control" element={<GtmControl />} />
                <Route path="/holo-crm" element={<HoloCrm />} />
                <Route path="/holoorg-economy" element={<HoloorgEconomy />} />
                <Route path="/holoorg-fleet" element={<HoloorgFleet />} />
                <Route path="/holoorg-schema" element={<HoloorgSchema />} />
                <Route path="/holoorg-tasks" element={<HoloorgTasks />} />
                <Route path="/insight-os" element={<InsightOs />} />
                <Route path="/ip-research" element={<IpResearch />} />
                <Route path="/knowledge" element={<Knowledge />} />
                <Route path="/lcd" element={<Lcd />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/level15" element={<Level15 />} />
                <Route path="/level23" element={<Level23 />} />
                <Route path="/linkedin" element={<Linkedin />} />
                <Route path="/linkedin-content" element={<LinkedinContent />} />
                <Route path="/living-cells" element={<LivingCells />} />
                <Route path="/living-company" element={<LivingCompany />} />
                <Route path="/maat-sources" element={<MaatSources />} />
                <Route path="/narrative" element={<Narrative />} />
                <Route path="/orchestrator" element={<Orchestrator />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/ozbridge-swarm" element={<OzbridgeSwarm />} />
                <Route path="/pel" element={<Pel />} />
                <Route path="/portfolio-forensic" element={<PortfolioForensic />} />
                <Route path="/product-flywheel" element={<ProductFlywheel />} />
                <Route path="/rdti-corpus" element={<RdtiCorpus />} />
                <Route path="/report-factory" element={<ReportFactory />} />
                <Route path="/revenue" element={<Revenue />} />
                <Route path="/rocket-control" element={<RocketControl />} />
                <Route path="/scout" element={<Scout />} />
                <Route path="/sell-loop" element={<SellLoop />} />
                <Route path="/spine-ops" element={<SpineOps />} />
                <Route path="/thriving-kids" element={<ThrivingKids />} />
                <Route path="/trojanoz" element={<Trojanoz />} />
                <Route path="/watchdog" element={<Watchdog />} />
                <Route path="/workfamily" element={<WorkfamilyPlatform />} />
                <Route path="/webops" element={<Webops />} />
                <Route path="/maat-spine" element={<Maat121Spine />} />
                <Route path="*" element={<NotFound />} />
                            <Route path="/dossier" element={<Dossier />} />
                            <Route path="/dogfood" element={<Dogfood />} />
                            <Route path="/connections" element={<Connections />} />
                            <Route path="/mcp" element={<Mcp />} />
                            <Route path="/octoparse" element={<Octoparse />} />
                            <Route path="/growth" element={<Growth />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </BrowserRouter>
        <StatusBar />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
