import { useEffect, useState } from 'react';
import { Bot, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface AgentMessage {
  id: string;
  agent: string;
  message: string;
  timestamp: string;
  status: 'active' | 'idle' | 'error';
}

const AGENT_CHANNEL_URL = 'https://agent-channel.vercel.app';

// Simulated live feed — replace with real WS/API endpoint when available
function useMockAgentFeed() {
  const [messages, setMessages] = useState<AgentMessage[]>([
    { id: '1', agent: 'claude-research', message: 'IP capture complete — 3 nodes stored', timestamp: new Date(Date.now() - 120000).toISOString(), status: 'idle' },
    { id: '2', agent: 'troy-sql-executor', message: 'Query executed: widgets table OK', timestamp: new Date(Date.now() - 60000).toISOString(), status: 'active' },
    { id: '3', agent: 'jet-v2', message: 'Adzuna scan: 14 new roles found', timestamp: new Date(Date.now() - 30000).toISOString(), status: 'active' },
  ]);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${AGENT_CHANNEL_URL}/api/feed`, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.messages)) {
            setMessages(data.messages.slice(0, 6));
          }
        }
        setOnline(true);
      } catch {
        setOnline(false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return { messages, online };
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400',
  idle: 'text-yellow-400',
  error: 'text-red-400',
};

export function AgentChannelWidget() {
  const { messages, online } = useMockAgentFeed();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-blue-500 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold text-sm">Agent Channel</h3>
        </div>
        <div className="flex items-center gap-2">
          {online
            ? <Wifi className="w-3 h-3 text-green-400" />
            : <WifiOff className="w-3 h-3 text-red-400" />}
          <span className={`px-2 py-0.5 text-xs rounded-full ${online ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {online ? 'LIVE' : 'OFFLINE'}
          </span>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="text-gray-500 hover:text-blue-400 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 text-xs mb-3">
        <span className="px-2 py-1 bg-gray-800 text-blue-400 rounded">
          {messages.filter(m => m.status === 'active').length} active
        </span>
        <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded">
          {messages.length} recent
        </span>
        <span className="px-2 py-1 bg-gray-800 text-purple-400 rounded">
          15s poll
        </span>
      </div>

      {/* Message feed */}
      <div className="space-y-2 mb-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2 p-2 bg-gray-800/60 rounded">
            <span className={`text-xs font-mono mt-0.5 ${STATUS_COLORS[msg.status] ?? 'text-gray-400'}`}>●</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono text-blue-300 truncate">{msg.agent}</span>
                <span className="text-xs text-gray-600 shrink-0">{timeAgo(msg.timestamp)}</span>
              </div>
              <p className="text-xs text-gray-300 truncate mt-0.5">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <a
        href={AGENT_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-2 bg-blue-900/20 border border-blue-700/40 rounded text-blue-400 text-xs hover:bg-blue-900/40 transition-colors"
      >
        <span>Open Agent Channel</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
