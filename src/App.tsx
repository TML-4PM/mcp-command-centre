import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
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
            <Route path="/" element={<MCPCommandCentre />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/commands" element={<Commands />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/sql-queries" element={<SQLQueries />} />
            <Route path="/infra" element={<Infra />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
