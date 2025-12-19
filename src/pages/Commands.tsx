import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const commands = [
  { slash: '/cc', mode: 'command_centre', desc: 'Full thread reconciliation' },
  { slash: '/bs', mode: 'bridge_session', desc: 'Full autonomy mode' },
  { slash: '/prove', mode: 'full_state_sync', desc: 'Prove what is true' },
  { slash: '/judge', mode: 'assumption_breaker', desc: 'Validate assumptions' },
  { slash: '/audit', mode: 'artifact_audit', desc: 'Check completeness' },
  { slash: '/kill', mode: 'error_burial', desc: 'Fix root causes' },
  { slash: '/plan', mode: 'forward_planner', desc: 'Business & delivery' },
  { slash: '/mission', mode: 'context_refresh', desc: 'Lock the mission' },
  { slash: '/cleanup', mode: 'cleanup_archive', desc: 'Reduce noise' },
  { slash: '/capture', mode: 'browser_capture', desc: 'Snapshot tabs' },
  { slash: '/restore', mode: 'browser_restore', desc: 'Restore tier 1' },
];

const stats = [
  { value: 11, label: 'Commands' },
  { value: 10, label: 'Operating' },
  { value: 1, label: 'Session' },
  { value: 38, label: 'Aliases' },
  { value: 17, label: 'Files' },
];

const Commands = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-4 mb-2">
            <Link 
              to="/" 
              className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <h1 className="text-2xl font-bold">MCP Bridge Command Centre</h1>
          </div>
          <p className="text-gray-400 text-sm ml-12">Operating language for Bridge and AI interactions • v2</p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Command Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commands.map(cmd => (
            <div 
              key={cmd.slash} 
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-xl font-bold text-green-400">{cmd.slash}</code>
                <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full">active</span>
              </div>
              <p className="text-gray-300 text-sm mb-1">{cmd.desc}</p>
              <p className="text-gray-600 text-xs">{cmd.mode}</p>
            </div>
          ))}
        </div>

        {/* Closure Contract Box */}
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/40 rounded-lg">
          <h3 className="text-yellow-400 font-semibold mb-2">Closure Contract</h3>
          <p className="text-gray-300 text-sm">Every command must emit a closure artifact with: findings, actions_taken, residuals, guarantees</p>
        </div>
      </div>
    </div>
  );
};

export default Commands;
