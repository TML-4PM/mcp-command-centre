import { useEffect, useState } from "react";
import { bridgeSQL } from "@/lib/bridge";

interface GroupRow {
  group_code: string;
  group_name: string;
  business_count: number;
  active_count: number;
}

const GROUP_COLORS: Record<string, string> = {
  G1: "#3B82F6", G2: "#8B5CF6", G3: "#10B981",
  G4: "#F59E0B", G5: "#EF4444", G6: "#EC4899", G7: "#14B8A6"
};

const Portfolio = () => {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bridgeSQL(`
      SELECT group_code, group_name,
        COUNT(*) as business_count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count
      FROM mcp_business_registry
      WHERE group_code IS NOT NULL
      GROUP BY group_code, group_name
      ORDER BY group_code
    `).then(res => {
      const rows = res.rows ?? res;
      setGroups(rows);
      setTotalBusinesses(rows.reduce((s: number, r: GroupRow) => s + Number(r.business_count), 0));
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Loading portfolio...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Taxonomy</h1>
        <p className="text-muted-foreground mt-2">{totalBusinesses} businesses across {groups.length} groups · live</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const color = GROUP_COLORS[group.group_code] ?? "#6366F1";
          return (
            <div
              key={group.group_code}
              className="p-6 glass rounded-lg border-2 transition-all hover:shadow-xl hover:scale-105"
              style={{ borderColor: color }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{group.group_name || group.group_code}</h3>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><strong>{group.business_count}</strong> businesses</div>
                <div><strong>{group.active_count}</strong> active</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Portfolio;
