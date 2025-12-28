import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchResult {
  id: string;
  source: string;
  title: string;
  created_at: string;
  message_count: number;
  rank: number;
  headline: string;
}

const Search = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Enter a search query",
        description: "Please type something to search for.",
        variant: "default"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_chat_archives', {
        query: query,
        source_filter: sourceFilter === "all" ? null : sourceFilter,
        limit_count: 50
      });

      if (error) throw error;
      setResults(data || []);
      
      if (data?.length === 0) {
        toast({
          title: "No results found",
          description: `No matches for "${query}". Try different keywords.`,
        });
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: error.message || "Unable to search. Please try again.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (source: string) => {
    switch (source) {
      case 'gpt': return '💬';
      case 'claude': return '🤖';
      case 'linkedin': return '📝';
      case 'slack': return '💼';
      default: return '💻';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Universal Search</h1>
        <p className="text-muted-foreground mt-2">Search across conversations, code blocks, and articles</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search across all conversations, code, articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="gpt">GPT</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={loading} className="px-8">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {results.length === 0 && !loading ? (
          <div className="text-center text-muted-foreground py-8">
            {query ? 'No results found' : 'Enter a search query to find conversations'}
          </div>
        ) : (
          results.map((result) => (
            <div key={result.id} className="p-6 glass rounded-lg hover:border-primary/50 transition-all border border-border">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{getIcon(result.source)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{result.title || 'Untitled'}</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{result.source}</span>
                  </div>
                  <div 
                    className="text-sm text-muted-foreground mb-3"
                    dangerouslySetInnerHTML={{ __html: result.headline || '' }}
                  />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(result.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{result.message_count} messages</span>
                    <span>•</span>
                    <span>Relevance: {(result.rank * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Search;
