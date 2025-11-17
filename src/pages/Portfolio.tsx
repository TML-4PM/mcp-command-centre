const Portfolio = () => {
  const portfolioGroups = [
    { name: "Core Brands", color: "#3B82F6", repos: 3, websites: 3 },
    { name: "GCBAT Ecosystem", color: "#8B5CF6", repos: 3, websites: 3 },
    { name: "Holo-Org/AHC", color: "#10B981", repos: 3, websites: 3 },
    { name: "Research", color: "#F59E0B", repos: 3, websites: 1 },
    { name: "RATPAK", color: "#EF4444", repos: 3, websites: 1 },
    { name: "NEUROPAK", color: "#EC4899", repos: 3, websites: 0 },
    { name: "Calculators", color: "#14B8A6", repos: 3, websites: 1 },
    { name: "MCP Infra", color: "#6366F1", repos: 3, websites: 0 },
    { name: "Lovable", color: "#A855F7", repos: 3, websites: 3 }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Taxonomy</h1>
        <p className="text-muted-foreground mt-2">9 project groups across 107 repositories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioGroups.map((group) => (
          <div
            key={group.name}
            className="p-6 glass rounded-lg border-2 transition-all hover:shadow-xl hover:scale-105"
            style={{ borderColor: group.color }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{group.name}</h3>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color }}></div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div><strong>{group.repos}</strong> repositories</div>
              <div><strong>{group.websites}</strong> websites</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
