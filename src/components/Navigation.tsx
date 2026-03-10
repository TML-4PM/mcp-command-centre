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
      { to: "/finance", label: "Finance" },
      { to: "/grants", label: "Grants" },
      { to: "/rd", label: "R&D" },
      { to: "/tax", label: "Tax" },
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
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/jobs", label: "Jobs" },
      { to: "/search", label: "Search" },
      { to: "/outreach", label: "Outreach" },
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
    ],
  },
];

const Navigation = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="glass border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5 min-w-0 shrink-0 group">
            <img
              src="https://lzfgigiyqpuuxslsygjt.supabase.co/storage/v1/object/public/images/T4H%20Logo%201.jpg"
              alt="T4H Logo"
              className="w-8 h-8 rounded-md object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap">
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