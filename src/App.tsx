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
                <Route path="*" element={<NotFound />} />
                            <Route path="/dossier" element={<Dossier />} />
                            <Route path="/dogfood" element={<Dogfood />} />
                            <Route path="/connections" element={<Connections />} />
                            <Route path="/mcp" element={<Mcp />} />
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