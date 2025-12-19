import { Terminal, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const COMMANDS = [
  { slash: '/cc', file: 'command_centre', description: 'Full thread reconciliation' },
  { slash: '/bs', file: 'bridge_session', description: 'Full autonomy mode' },
  { slash: '/prove', file: 'full_state_sync', description: 'Prove what is true' },
  { slash: '/judge', file: 'assumption_breaker', description: 'Validate assumptions' },
  { slash: '/audit', file: 'artifact_audit', description: 'Check completeness' },
  { slash: '/kill', file: 'error_burial', description: 'Fix root causes' },
  { slash: '/plan', file: 'forward_planner', description: 'Business & delivery' },
  { slash: '/mission', file: 'context_refresh', description: 'Lock the mission' },
  { slash: '/cleanup', file: 'cleanup_archive', description: 'Reduce noise' },
  { slash: '/capture', file: 'browser_capture', description: 'Snapshot tabs' },
  { slash: '/restore', file: 'browser_restore', description: 'Restore tier 1' },
];

const STATS = [
  { label: 'Commands', value: 11 },
  { label: 'Operating', value: 10 },
  { label: 'Session', value: 1 },
  { label: 'Aliases', value: 38 },
  { label: 'Files', value: 17 },
];

const Commands = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">MCP Bridge Command Centre</h1>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded animate-pulse">
              LIVE
            </span>
          </div>
          <p className="text-slate-400 mt-2">11 slash commands powering the MCP bridge automation system</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-3">
        {STATS.map((stat) => (
          <div 
            key={stat.label}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg"
          >
            <span className="text-2xl font-bold text-white">{stat.value}</span>
            <span className="text-slate-400 ml-2 text-sm">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Command Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {COMMANDS.map((command) => (
          <div
            key={command.slash}
            className="p-4 bg-slate-900 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 font-mono font-bold text-lg">
                {command.slash}
              </span>
            </div>
            <div className="text-slate-500 text-xs font-mono mb-2">
              {command.file}
            </div>
            <div className="text-slate-300 text-sm">
              {command.description}
            </div>
          </div>
        ))}
      </div>

      {/* Closure Contract Box */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl">📋</span>
          <div>
            <h3 className="text-white font-semibold mb-1">Closure Contract</h3>
            <p className="text-slate-400 text-sm">
              All commands are bound to session scope. Each command execution is tracked and 
              reconciled through the MCP bridge. State changes are persisted to the artifact 
              system for full auditability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Commands;
