import { Terminal } from 'lucide-react';

const COMMANDS = [
  '/cc', '/bs', '/prove', '/judge', '/audit', 
  '/kill', '/plan', '/mission', '/cleanup', '/capture', '/restore'
];

const COMMAND_CENTRE_URL = 'https://troy-bridge-files.s3.ap-southeast-2.amazonaws.com/commands/command_centre.html';

export function CommandCentreWidget() {
  const handleClick = () => {
    window.open(COMMAND_CENTRE_URL, '_blank');
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-slate-900 rounded-xl p-4 border border-slate-700 cursor-pointer hover:border-slate-500 transition-colors"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-white font-semibold">Command Centre</h3>
        </div>
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded animate-pulse">
          LIVE
        </span>
      </div>

      <div className="flex gap-2 text-xs mb-4">
        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">11 commands</span>
        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">10 operating</span>
        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">1 session</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {COMMANDS.map((cmd) => (
          <span 
            key={cmd} 
            className="px-2 py-1 bg-slate-800 text-emerald-400 text-xs font-mono rounded hover:bg-slate-700 transition-colors"
          >
            {cmd}
          </span>
        ))}
      </div>

      <div className="p-2 bg-slate-800/50 border border-slate-700 rounded text-slate-400 text-xs">
        📋 Closure contract: All commands bound to session scope
      </div>
    </div>
  );
}
