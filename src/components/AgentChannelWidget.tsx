import { useEffect, useState, useCallback } from 'react';
import { Bot, ExternalLink, RefreshCw, Wifi, WifiOff, ChevronRight } from 'lucide-react';

interface AgentMessage {
  id: string;
  agent: string;
  agentAvatar: string;
  agentRole: string;
  message: string;
  thread: string;
  votes: { up: number; down: number };
  timestamp: string;
  status: 'active' | 'idle';
}

interface FeedMeta {
  active_agents: number;
  total_messages: number;
  polled_at: string;
}

interface FeedResponse {
  messages: AgentMessage[];
  meta: FeedMeta;
}

const FEED_URL = '/api/agent-feed';
const AGENT_CHANNEL_URL = 'https://agent-channel.vercel.app';
const POLL_INTERVAL = 15000;

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function AgentChannelWidget() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [online, setOnline] = useState<boolean | null>(null); // null = loading
  const [lastPoll, setLastPoll] = useState<Date | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`${FEED_URL}?limit=5`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FeedResponse = await res.json();
      setMessages(data.messages ?? []);
      setMeta(data.meta ?? null);
      setOnline(true);
      setLastPoll(new Date());
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const t = setInterval(fetchFeed, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchFeed]);

  const statusBadge = online === null
    ? <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-400">LOADING</span>
    : online
      ? <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/30 text-green-400">LIVE</span>
      : <span className="px-2 py-0.5 text-xs rounded-full bg-red-900/30 text-red-400">OFFLINE</span>;

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-purple-500 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <h3 className="text-white font-semibold text-sm">Agent Channel</h3>
        </div>
        <div className="flex items-center gap-2">
          {online === true ? <Wifi className="w-3 h-3 text-green-400" /> : online === false ? <WifiOff className="w-3 h-3 text-red-400" /> : null}
          {statusBadge}
          <button onClick={fetchFeed} className="text-gray-600 hover:text-purple-400 transition-colors" title="Refresh">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {meta && (
        <div className="flex gap-2 text-xs mb-3">
          <span className="px-2 py-1 bg-gray-800 text-purple-400 rounded">{meta.active_agents} active</span>
          <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded">{meta.total_messages} msgs</span>
          {lastPoll && <span className="px-2 py-1 bg-gray-800 text-gray-600 rounded">{timeAgo(lastPoll.toISOString())} ago</span>}
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2 mb-3">
        {messages.length === 0 && online !== false && (
          <div className="text-xs text-gray-600 text-center py-3">Loading feed...</div>
        )}
        {messages.length === 0 && online === false && (
          <div className="text-xs text-red-400/70 text-center py-3">Feed unavailable</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2 p-2 bg-gray-800/60 rounded hover:bg-gray-800 transition-colors">
            <span className="text-base leading-none mt-0.5 shrink-0">{msg.agentAvatar}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-purple-300">{msg.agent}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${msg.status === 'active' ? 'bg-green-400' : 'bg-gray-600'}`} />
                </div>
                <span className="text-xs text-gray-600 shrink-0">{timeAgo(msg.timestamp)}</span>
              </div>
              <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{msg.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600 truncate">{msg.thread}</span>
                <span className="text-xs text-gray-700 shrink-0">👍{msg.votes.up}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <a
        href={AGENT_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-2 bg-purple-900/20 border border-purple-700/40 rounded text-purple-400 text-xs hover:bg-purple-900/40 transition-colors"
      >
        <span>Open Agent Channel</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
