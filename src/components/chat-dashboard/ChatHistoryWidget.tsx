import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageSquare, Clock, User, Zap, FileCode, Globe,
  Search, Filter, Calendar, ChevronRight, ExternalLink,
  Star, Tag, Archive
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatItem {
  id: string;
  title: string;
  source: 'gpt' | 'claude' | 'loveable' | 's3' | 'local';
  created_at: Date;
  updated_at: Date;
  messageCount?: number;
  tags?: string[];
  starred?: boolean;
  preview?: string;
}

interface ChatHistoryWidgetProps {
  limit?: number;
}

const ChatHistoryWidget = ({ limit }: ChatHistoryWidgetProps) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, [filterSource, sortBy]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      // Fetch from Supabase conversations table
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(limit || 50);

      if (error) throw error;

      // Transform and enrich with mock source data
      const sources = ['gpt', 'claude', 'loveable', 's3', 'local'] as const;
      const enrichedChats: ChatItem[] = (data || []).map((chat, idx) => ({
        id: chat.id,
        title: chat.title || 'Untitled Conversation',
        source: sources[idx % sources.length],
        created_at: new Date(chat.created_at),
        updated_at: new Date(chat.created_at),
        messageCount: Math.floor(Math.random() * 50) + 5,
        tags: idx % 3 === 0 ? ['important'] : idx % 5 === 0 ? ['review'] : [],
        starred: idx % 7 === 0,
        preview: 'Last message preview would appear here...'
      }));

      setChats(enrichedChats);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      // Mock data fallback
      setChats([
        {
          id: '1',
          title: 'MCP Dashboard Architecture Discussion',
          source: 'claude',
          created_at: new Date(Date.now() - 3600000),
          updated_at: new Date(Date.now() - 1800000),
          messageCount: 47,
          tags: ['important', 'architecture'],
          starred: true,
          preview: 'We should consolidate all the dashboard widgets...'
        },
        {
          id: '2',
          title: 'GPT Reports Automation Setup',
          source: 'gpt',
          created_at: new Date(Date.now() - 7200000),
          updated_at: new Date(Date.now() - 3600000),
          messageCount: 23,
          tags: ['automation'],
          starred: false,
          preview: 'Setting up the weekly report generation...'
        },
        {
          id: '3',
          title: 'Loveable Component Library Review',
          source: 'loveable',
          created_at: new Date(Date.now() - 86400000),
          updated_at: new Date(Date.now() - 43200000),
          messageCount: 15,
          starred: false,
          preview: 'The shadcn components are working well...'
        },
        {
          id: '4',
          title: 'S3 Data Migration Planning',
          source: 's3',
          created_at: new Date(Date.now() - 172800000),
          updated_at: new Date(Date.now() - 86400000),
          messageCount: 31,
          tags: ['migration'],
          starred: true,
          preview: 'Need to consolidate the multiple buckets...'
        },
        {
          id: '5',
          title: 'Local Development Environment Setup',
          source: 'local',
          created_at: new Date(Date.now() - 259200000),
          updated_at: new Date(Date.now() - 172800000),
          messageCount: 8,
          starred: false,
          preview: 'MCP bridge is running smoothly now...'
        }
      ]);
    }
    setIsLoading(false);
  };

  const getSourceIcon = (source: ChatItem['source']) => {
    switch (source) {
      case 'gpt': return <Zap className="w-4 h-4 text-green-500" />;
      case 'claude': return <FileCode className="w-4 h-4 text-purple-500" />;
      case 'loveable': return <Globe className="w-4 h-4 text-pink-500" />;
      case 's3': return <Archive className="w-4 h-4 text-orange-500" />;
      case 'local': return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSourceBadge = (source: ChatItem['source']) => {
    const styles: Record<string, string> = {
      gpt: 'bg-green-500/20 text-green-400 border-green-500/30',
      claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      loveable: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      s3: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      local: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return <Badge className={styles[source]}>{source.toUpperCase()}</Badge>;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSource === 'all' || chat.source === filterSource;
    return matchesSearch && matchesFilter;
  });

  const isCompact = limit && limit <= 10;

  if (isCompact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Recent Chats
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {filteredChats.slice(0, limit).map(chat => (
                <div
                  key={chat.id}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {getSourceIcon(chat.source)}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{chat.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(chat.created_at)}
                          {chat.starred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Chat History
            </CardTitle>
            <CardDescription>All conversations across sources</CardDescription>
          </div>
          <Badge variant="outline">{chats.length.toLocaleString()} total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="gpt">ChatGPT</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="loveable">Loveable</SelectItem>
              <SelectItem value="s3">S3</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="messages">Most Messages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chat List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredChats.map(chat => (
              <div
                key={chat.id}
                className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-muted/50">
                      {getSourceIcon(chat.source)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{chat.title}</span>
                        {chat.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {chat.preview}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {getSourceBadge(chat.source)}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {chat.messageCount} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(chat.created_at)}
                        </span>
                      </div>
                      {chat.tags && chat.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {chat.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatHistoryWidget;
