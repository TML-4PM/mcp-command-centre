import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";

// Core pages
import MCPCommandCentre from "./pages/MCPCommandCentre";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Commands from "./pages/Commands";
import Portfolio from "./pages/Portfolio";
import Tasks from "./pages/Tasks";
import Outreach from "./pages/Outreach";
import SQLQueries from "./pages/SQLQueries";
import Infra from "./pages/Infra";
import Assets from "./pages/Assets";
import Finance from "./pages/Finance";
import NotFound from "./pages/NotFound";

// Restored pages
import ChatDashboard from "./pages/ChatDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import CMODashboard from "./pages/CMODashboard";

// New dedicated pages
import MaatSystem from "./pages/MaatSystem";
import Grants from "./pages/Grants";
import RnD from "./pages/RnD";
import Businesses from "./pages/Businesses";
import NeuralEnnead from "./pages/NeuralEnnead";

// Bridge-powered pages
import Agents from "./pages/Agents";
import Analytics from "./pages/Analytics";
import AppConsole from "./pages/AppConsole";
import Architecture from "./pages/Architecture";
import Content from "./pages/Content";
import Crawler from "./pages/Crawler";
import Customers from "./pages/Customers";
import Health from "./pages/Health";
import Hob from "./pages/Hob";
import IpPortfolio from "./pages/IpPortfolio";
import Jobs from "./pages/Jobs";
import Metrics from "./pages/Metrics";
import Pricing from "./pages/Pricing";
import Products from "./pages/Products";
import Signals from "./pages/Signals";
import Systems from "./pages/Systems";
import Tax from "./pages/Tax";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Routes>
            {/* Operations */}
            <Route path="/" element={<MCPCommandCentre />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/systems" element={<Systems />} />
            <Route path="/architecture" element={<Architecture />} />

            {/* Commercial */}
            <Route path="/products" element={<Products />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/crawler" element={<Crawler />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/content" element={<Content />} />
            <Route path="/hob" element={<Hob />} />

            {/* Finance — MAAT System */}
            <Route path="/finance" element={<Finance />} />
            <Route path="/maat" element={<MaatSystem />} />
            <Route path="/grants" element={<Grants />} />
            <Route path="/rd" element={<RnD />} />
            <Route path="/tax" element={<Tax />} />

            {/* Assets */}
            <Route path="/assets" element={<Assets />} />
            <Route path="/ip" element={<IpPortfolio />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/ennead" element={<NeuralEnnead />} />
            <Route path="/workers" element={<WorkerDashboard />} />

            {/* Intelligence */}
            <Route path="/health" element={<Health />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/cmo" element={<CMODashboard />} />

            {/* Personal */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/search" element={<Search />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/portfolio" element={<Portfolio />} />

            {/* Platform */}
            <Route path="/infra" element={<Infra />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/apps" element={<AppConsole />} />
            <Route path="/sql-queries" element={<SQLQueries />} />
            <Route path="/chat-ops" element={<ChatDashboard />} />
            <Route path="/commands" element={<Commands />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
