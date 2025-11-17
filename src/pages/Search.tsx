import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source_type: string;
  created_at: string;
  relevance: number;
}

const Search = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('unified_search', {
        query_text: query
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "Unable to search at this time. Please try again.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'gpt_conversation': return '💬';
      case 'claude_conversation': return '🤖';
      case 'linkedin_article': return '📝';
      default: return '💻';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Universal Search</h1>
        <p className="text-muted-foreground mt-2">Search across 76,701 conversations, code blocks, and articles</p>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search across all conversations, code, articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-muted border-border"
        />
        <Button onClick={handleSearch} disabled={loading} className="px-8">
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="space-y-4">
        {results.length === 0 && !loading ? (
          <div className="text-center text-muted-foreground py-8">
            {query ? 'No results found' : 'Enter a search query'}
          </div>
        ) : (
          results.map((result) => (
            <div key={result.id} className="p-6 glass rounded-lg hover:border-primary/50 transition-all border border-border">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{getIcon(result.source_type)}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{result.title}</h3>
                  <div className="text-sm text-muted-foreground mb-3">{result.snippet}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(result.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Relevance: {(result.relevance * 100).toFixed(1)}%</span>
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
