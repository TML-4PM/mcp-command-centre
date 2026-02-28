import { useState } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Loader2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface SearchResult {
  source: string;
  title: string;
  detail: string;
  match_context: string;
}

const SEARCH_SOURCES = [
  { value: "all", label: "All Sources" },
  { value: "businesses", label: "Businesses" },
  { value: "ip", label: "IP Assets" },
  { value: "products", label: "Products" },
  { value: "agents", label: "Agents" },
  { value: "grants", label: "Grants" },
  { value: "sites", label: "Sites & Domains" },
  { value: "transactions", label: "Transactions" },
];

const buildSearchSQL = (q: string, source: string): string => {
  const escaped = q.replace(/'/g, "''");
  const like = `%${escaped}%`;
  const queries: string[] = [];

  if (source === "all" || source === "businesses") {
    queries.push(`SELECT 'Business' as source, business_name as title, coalesce(business_key,'') as detail, group_name as match_context FROM mcp_business_registry WHERE business_name ILIKE '${like}' OR business_key ILIKE '${like}' OR group_name ILIKE '${like}'`);
  }
  if (source === "all" || source === "ip") {
    queries.push(`SELECT 'IP Asset' as source, title, coalesce(ip_type,'') as detail, coalesce(family,'') as match_context FROM ip_assets WHERE title ILIKE '${like}' OR description ILIKE '${like}' OR family ILIKE '${like}'`);
  }
  if (source === "all" || source === "products") {
    queries.push(`SELECT 'Product' as source, product_name as title, coalesce(category,'') as detail, coalesce(business_key,'') as match_context FROM catalog_master WHERE product_name ILIKE '${like}' OR description ILIKE '${like}'`);
  }
  if (source === "all" || source === "agents") {
    queries.push(`SELECT 'Agent' as source, name as title, coalesce(role,'') as detail, coalesce(family,'') as match_context FROM neural_ennead_members WHERE name ILIKE '${like}' OR role ILIKE '${like}' OR specialization ILIKE '${like}'`);
  }
  if (source === "all" || source === "grants") {
    queries.push(`SELECT 'Grant' as source, title, coalesce(agency,'') as detail, coalesce(program_name,'') as match_context FROM grants.opportunities WHERE title ILIKE '${like}' OR agency ILIKE '${like}'`);
    queries.push(`SELECT 'MAAT Grant' as source, grant_name as title, coalesce(provider,'') as detail, coalesce(status,'') as match_context FROM maat_grants WHERE grant_name ILIKE '${like}' OR provider ILIKE '${like}'`);
  }
  if (source === "all" || source === "sites") {
    queries.push(`SELECT 'Site' as source, domain as title, coalesce(business_key,'') as detail, coalesce(status,'') as match_context FROM sites_registry WHERE domain ILIKE '${like}' OR business_key ILIKE '${like}'`);
  }
  if (source === "all" || source === "transactions") {
    queries.push(`SELECT 'Transaction' as source, description as title, coalesce(counterparty,'') as detail, amount::text as match_context FROM maat_transactions WHERE description ILIKE '${like}' OR counterparty ILIKE '${like}' LIMIT 30`);
  }

  return queries.join(" UNION ALL ") + " LIMIT 100";
};

const Search = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const sql = buildSearchSQL(query.trim(), sourceFilter);
      const r = await bridgeSQL(sql);
      setResults(r.rows || []);
      if (r.rows.length === 0) {
        toast({ title: "No results", description: `Nothing matched "${query}"` });
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.source]) acc[r.source] = [];
    acc[r.source].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">🔍 Universal Search</h1>
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search businesses, IP, products, agents, grants, sites, transactions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-slate-800 border-slate-700"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_SOURCES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-500">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
          <span className="ml-2">Search</span>
        </Button>
      </div>

      {results.length > 0 && (
        <div className="text-sm text-slate-400">{results.length} results across {Object.keys(grouped).length} sources</div>
      )}

      {Object.entries(grouped).map(([source, items]) => (
        <Card key={source} className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {source} <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-400">{items.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700/30 border border-slate-800">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 truncate">{r.title || "—"}</div>
                    <div className="text-xs text-slate-500 truncate">{r.detail}{r.match_context ? ` · ${r.match_context}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Search;
