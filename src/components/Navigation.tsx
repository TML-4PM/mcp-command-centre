import { NavLink } from "./NavLink";

const Navigation = () => {
  const navItems = [
    { to: "/", label: "Overview" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/search", label: "Search" },
    { to: "/commands", label: "Commands" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/tasks", label: "Tasks" },
    { to: "/outreach", label: "Outreach" },
    { to: "/infra", label: "Infra" },
    { to: "/sql-queries", label: "SQL" },
  ];

  return (
    <nav className="glass border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MCP Command Centre
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="px-3 sm:px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-all"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary"
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
