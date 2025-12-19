import { Terminal, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const COMMANDS = ['/cc', '/bs', '/prove', '/judge', '/audit', '/kill', '/plan', '/mission', '/cleanup', '/capture', '/restore'];

export function CommandCentreWidget() {
  return (
    <Link 
      to="/commands"
      className="block bg-gray-900 rounded-xl p-4 border border-gray-800 cursor-pointer hover:border-blue-500 transition-colors"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-green-400" />
          <h3 className="text-white font-semibold">Command Centre</h3>
        </div>
        <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
          LIVE
        </span>
      </div>

      <div className="flex gap-2 text-xs mb-4">
        <span className="px-2 py-1 bg-gray-800 text-blue-400 rounded">11 commands</span>
        <span className="px-2 py-1 bg-gray-800 text-blue-400 rounded">10 operating</span>
        <span className="px-2 py-1 bg-gray-800 text-blue-400 rounded">1 session</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {COMMANDS.map((cmd) => (
          <span 
            key={cmd} 
            className="px-2 py-1 bg-gray-800 text-green-400 text-xs font-mono rounded"
          >
            {cmd}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between p-2 bg-yellow-900/20 border border-yellow-700/40 rounded text-yellow-400 text-xs">
        <span>📋 Closure contract: All commands bound to session scope</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
