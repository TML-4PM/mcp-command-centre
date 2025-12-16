import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueueItem {
  id: string;
  command: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  created_at: string;
}

export function McpQueueWidget() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, failed: 0 });

  useEffect(() => {
    fetchQueue();
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mcp_command_queue' }, () => fetchQueue())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchQueue() {
    const { data } = await supabase.from('mcp_command_queue').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) {
      setQueue(data as QueueItem[]);
      setStats({
        pending: data.filter(i => i.status === 'pending').length,
        completed: data.filter(i => i.status === 'completed').length,
        failed: data.filter(i => i.status === 'failed').length,
      });
    }
  }

  const statusColor: Record<string, string> = { pending: 'bg-yellow-500', processing: 'bg-blue-500 animate-pulse', completed: 'bg-green-500', failed: 'bg-red-500' };

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">MCP Command Queue</h3>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">{stats.pending} pending</span>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">{stats.completed} done</span>
          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">{stats.failed} failed</span>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {queue.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">Queue empty</p>
        ) : queue.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${statusColor[item.status] || 'bg-gray-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate font-mono">{item.command?.slice(0, 50)}...</p>
              <p className="text-slate-500 text-xs">{new Date(item.created_at).toLocaleTimeString()}</p>
            </div>
            <span className="text-xs text-slate-400 capitalize">{item.status}</span>
          </div>
        ))}
      </div>
      {stats.pending > 0 && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-xs">
          ⚠️ {stats.pending} commands waiting
        </div>
      )}
    </div>
  );
}
