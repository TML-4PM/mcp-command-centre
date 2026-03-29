import { NavLink } from "./NavLink";
import { useState } from "react";

const sections = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Overview" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/loop-os", label: "Loop OS" },
      { to: "/businesses", label: "Businesses" },
      { to: "/cap-store", label: "Cap Store" },
      { to: "/exec-spine", label: "Exec Spine" },
      { to: "/post-exec", label: "Post Exec" },
      { to: "/mission-control", label: "Mission" },
      { to: "/dogfood", label: "28×50 Dogfood" },
      { to: "/systems", label: "Systems" },
      { to: "/architecture", label: "Architecture" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { to: "/products", label: "Products" },
      { to: "/pricing", label: "Pricing" },
      { to: "/customers", label: "Sites" },
      { to: "/hob", label: "HOB" },
      { to: "/content", label: "Content" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/maat", label: "MAAT" },
      { to: "/accountant", label: "Accountant" },
      { to: "/finance", label: "Finance" },
      { to: "/grants", label: "Grants" },
      { to: "/rd", label: "R&D" },
      { to: "/tax", label: "Tax" },
      { to: "/governance", label: "Governance" },
    ],
  },
  {
    label: "Assets",
    items: [
      { to: "/assets", label: "Assets" },
      { to: "/ip", label: "IP" },
      { to: "/rd", label: "R&D" },
      { to: "/ennead", label: "Ennead" },
      { to: "/agents", label: "Agents" },
      { to: "/tools", label: "Tools" },
      { to: "/workers", label: "Workers" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/health", label: "Health" },
      { to: "/signals", label: "Signals" },
      { to: "/tasks", label: "Tasks" },
      { to: "/metrics", label: "Metrics" },
      { to: "/cmo", label: "CMO" },
      { to: "/dossier", label: "Dossier" },
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/jobs", label: "Jobs" },
      { to: "/search", label: "Search" },
      { to: "/outreach", label: "Outreach" },
      { to: "/octoparse", label: "Octoparse" },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/infra", label: "Infra" },
      { to: "/apps", label: "Apps" },
      { to: "/sql-queries", label: "SQL" },
      { to: "/chat-ops", label: "Chat Ops" },
      { to: "/portfolio-surface", label: "Surface" },
      { to: "/analytics", label: "Analytics" },
      { to: "/connections", label: "Connections" },
      { to: "/mcp", label: "MCP" },
      { to: "/growth", label: "Growth" },
      { to: "/portfolio", label: "Portfolio" },
      { to: "/crawler", label: "Crawler" },
      { to: "/commands", label: "Commands" },
    ],
  },
  {
    label: "Autonomy",
    items: [
      { to: "/autonomy", label: "Autonomy" },
      { to: "/level23", label: "L23" },
      { to: "/level15", label: "L15" },
      { to: "/orchestrator", label: "Orchestrator" },
      { to: "/autonomous-engine", label: "Auto Engine" },
      { to: "/spine-ops", label: "Spine Ops" },
      { to: "/rocket-control", label: "Rocket" },
    ],
  },
  {
    label: "CRM",
    items: [
      { to: "/crm", label: "CRM" },
      { to: "/leads", label: "Leads" },
      { to: "/campaign", label: "Campaign" },
      { to: "/sell-loop", label: "Sell Loop" },
      { to: "/gtm-control", label: "GTM" },
      { to: "/scout", label: "Scout" },
      { to: "/revenue", label: "Revenue" },
    ],
  },
  {
    label: "HoloOrg",
    items: [
      { to: "/holo-crm", label: "CRM" },
      { to: "/holoorg-economy", label: "Economy" },
      { to: "/holoorg-fleet", label: "Fleet" },
      { to: "/holoorg-schema", label: "Schema" },
      { to: "/holoorg-tasks", label: "Tasks" },
      { to: "/trojanoz", label: "TrojanOz" },
      { to: "/agent-ops", label: "Agent Ops" },
      { to: "/agent-capacity", label: "Capacity" },
    ],
  },
  {
    label: "R&D",
    items: [
      { to: "/rdti-corpus", label: "RDTI Corpus" },
      { to: "/ip-research", label: "IP Research" },
      { to: "/linkedin", label: "LinkedIn" },
      { to: "/linkedin-content", label: "LI Content" },
      { to: "/knowledge", label: "Knowledge" },
      { to: "/narrative", label: "Narrative" },
      { to: "/thriving-kids", label: "Thriving Kids" },
    ],
  },
  {
    label: "Ops",
    items: [
      { to: "/overview", label: "Overview" },
      { to: "/boardroom", label: "Boardroom" },
      { to: "/comet", label: "COMET" },
      { to: "/webops", label: "Web Ops" },
      { to: "/agoe-governance", label: "AGoE Gov" },
      { to: "/report-factory", label: "Reports" },
      { to: "/watchdog", label: "Watchdog" },
      { to: "/insight-os", label: "Insight OS" },
    ],
  },
  {
    label: "More",
    items: [
      { to: "/basiq", label: "BASIQ" },
      { to: "/maat-sources", label: "MAAT Src" },
      { to: "/pel", label: "PEL" },
      { to: "/product-flywheel", label: "Flywheel" },
      { to: "/portfolio-forensic", label: "P Forensic" },
      { to: "/living-company", label: "Living Co" },
      { to: "/living-cells", label: "Living Cells" },
      { to: "/cloud-migration", label: "Cloud Mig" },
      { to: "/bridge-terminal", label: "Bridge Term" },
      { to: "/ozbridge-swarm", label: "OzBridge" },
      { to: "/dsr", label: "DSR" },
      { to: "/lcd", label: "LCD" },
    ],
  },
];

const Navigation = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="glass border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <a href="/" className="relative flex items-center gap-3 min-w-0 shrink-0 group no-underline">
            <div className="absolute -left-6 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
            <div className="absolute left-16 top-1/2 h-16 w-20 -translate-y-1/2 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/90 shadow-[0_0_20px_rgba(79,123,255,0.25)] shrink-0">
              <img
                src="https://lzfgigiyqpuuxslsygjt.supabase.co/storage/v1/object/public/images/T4H%20Logo%201.jpg"
                alt="T4H"
                className="h-7 w-7 object-contain rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span className="relative text-[15px] font-semibold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent whitespace-nowrap">
              T4H Command Centre
            </span>
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="sm:hidden text-muted-foreground px-2 py-1 text-sm"
          >
            {expanded ? "✕" : "☰"}
          </button>
          <div className={`${expanded ? 'flex' : 'hidden'} sm:flex flex-wrap gap-x-1 gap-y-1 items-center`}>
            {sections.map((sec) => (
              <div key={sec.label} className="flex items-center gap-0.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider px-1 hidden lg:inline">{sec.label}</span>
                {sec.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted transition-all whitespace-nowrap"
                    activeClassName="bg-primary text-primary-foreground hover:bg-primary"
                  >
                    {item.label}
                  </NavLink>
                ))}
                <span className="text-slate-700 px-0.5 hidden sm:inline">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
