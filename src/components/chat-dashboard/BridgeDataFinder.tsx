import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Search, FileSpreadsheet, FolderOpen, RefreshCw, Download,
  CheckCircle, AlertCircle, Terminal, Upload, Database, File,
  HardDrive, FileText, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// MCP Bridge endpoint - operates on your Mac
const MCP_BRIDGE_URL = 'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com';

interface FileResult {
  path: string;
  name: string;
  type: string;
  size?: string;
  modified?: string;
}

interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

const BridgeDataFinder = () => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FileResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [customCommand, setCustomCommand] = useState("");
  const [commandOutput, setCommandOutput] = useState<string | null>(null);

  // Predefined search commands for Neural Ennead data
  const searchCommands = [
    {
      id: 'find-4500',
      name: 'Find 4500 Roles',
      command: 'find ~/Documents ~/Downloads ~/Desktop -type f \\( -name "*4500*" -o -name "*roles*" -o -name "*workers*" \\) 2>/dev/null | head -20',
      description: 'Search for files containing 4500, roles, or workers'
    },
    {
      id: 'find-neural',
      name: 'Find Neural/Ennead',
      command: 'find ~/Documents ~/Downloads ~/Desktop -type f \\( -name "*neural*" -o -name "*ennead*" -o -name "*9x9*" \\) 2>/dev/null | head -20',
      description: 'Search for Neural Ennead related files'
    },
    {
      id: 'find-csv',
      name: 'Find Large CSVs',
      command: 'find ~/Documents ~/Downloads ~/Desktop -name "*.csv" -size +100k 2>/dev/null | head -20',
      description: 'Find CSV files larger than 100KB'
    },
    {
      id: 'find-workfamily',
      name: 'Find WorkFamily',
      command: 'find ~/Documents ~/Downloads ~/Desktop -type f \\( -name "*workfamily*" -o -name "*work_family*" -o -name "*family*ai*" \\) 2>/dev/null | head -20',
      description: 'Search for WorkFamily AI related files'
    },
    {
      id: 'list-bridge',
      name: 'List MCP Bridge',
      command: 'ls -la ~/bridge/ ~/Documents/mcp_bridge/ 2>/dev/null',
      description: 'List contents of MCP Bridge directories'
    },
    {
      id: 'list-downloads',
      name: 'Recent Downloads',
      command: 'ls -lt ~/Downloads/*.{csv,xlsx,docx,pdf,json} 2>/dev/null | head -20',
      description: 'List recent data files in Downloads'
    },
    {
      id: 'grep-4500',
      name: 'Grep for 4500',
      command: 'grep -r "4500" ~/Documents/*.{csv,txt,md} 2>/dev/null | head -10',
      description: 'Search file contents for 4500'
    },
    {
      id: 'supabase-tables',
      name: 'Supabase Tables',
      command: `troy-sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 20"`,
      description: 'List Supabase tables'
    }
  ];

  // Execute command via MCP Bridge
  const executeBridgeCommand = async (command: string): Promise<CommandResult> => {
    try {
      const response = await fetch(`${MCP_BRIDGE_URL}/lambda/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'troy-mcp-command',
          payload: { command }
        })
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      return { success: true, output: data.output || JSON.stringify(data, null, 2) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const runSearch = async (searchCmd: typeof searchCommands[0]) => {
    setIsSearching(true);
    setSearchResults([]);
    setCommandOutput(null);

    toast({
      title: `Searching: ${searchCmd.name}`,
      description: "Executing via MCP Bridge on Mac...",
    });

    const result = await executeBridgeCommand(searchCmd.command);

    if (result.success && result.output) {
      setCommandOutput(result.output);

      // Parse output into file results
      const lines = result.output.split('\n').filter(l => l.trim());
      const files: FileResult[] = lines
        .filter(line => line.includes('/') && !line.startsWith('total'))
        .map(line => {
          // Handle both 'find' output (just paths) and 'ls -la' output
          if (line.includes('/Users/') || line.includes('~/')) {
            const path = line.trim();
            const parts = path.split('/');
            const name = parts[parts.length - 1];
            const ext = name.split('.').pop()?.toLowerCase() || '';

            return {
              path,
              name,
              type: ext
            };
          }
          return null;
        })
        .filter(Boolean) as FileResult[];

      setSearchResults(files);

      toast({
        title: "Search Complete",
        description: `Found ${files.length} files`,
      });
    } else {
      toast({
        title: "Search Failed",
        description: result.error || "No results",
        variant: "destructive"
      });
    }

    setIsSearching(false);
  };

  const readFile = async (filePath: string) => {
    setFileContent(null);
    setSelectedFile(filePath);

    toast({
      title: "Reading file...",
      description: filePath,
    });

    // Determine command based on file type
    const ext = filePath.split('.').pop()?.toLowerCase();
    let command: string;

    if (ext === 'csv' || ext === 'txt' || ext === 'md' || ext === 'json') {
      command = `head -100 "${filePath}"`;
    } else if (ext === 'xlsx' || ext === 'xls') {
      // Try to convert with csvkit if available, or just show file info
      command = `file "${filePath}" && ls -la "${filePath}"`;
    } else if (ext === 'docx' || ext === 'pdf') {
      // Show file info for binary files
      command = `file "${filePath}" && ls -la "${filePath}" && echo "---" && strings "${filePath}" | head -50`;
    } else {
      command = `head -50 "${filePath}"`;
    }

    const result = await executeBridgeCommand(command);

    if (result.success) {
      setFileContent(result.output || 'Empty file');
    } else {
      setFileContent(`Error: ${result.error}`);
    }
  };

  const runCustomCommand = async () => {
    if (!customCommand.trim()) return;

    setIsSearching(true);
    const result = await executeBridgeCommand(customCommand);

    setCommandOutput(result.output || result.error || 'No output');
    setIsSearching(false);

    toast({
      title: result.success ? "Command Complete" : "Command Failed",
      description: result.success ? "See output below" : result.error,
      variant: result.success ? "default" : "destructive"
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'csv': return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'xlsx': case 'xls': return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case 'json': return <FileText className="w-4 h-4 text-yellow-500" />;
      case 'docx': case 'doc': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              Bridge Data Finder
            </CardTitle>
            <CardDescription>Search Mac via MCP Bridge for 4500 roles, Neural Ennead docs</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Terminal className="w-3 h-3" />
            MCP Bridge
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Search Buttons */}
        <div>
          <div className="text-sm font-medium mb-2">Quick Searches</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {searchCommands.map(cmd => (
              <Button
                key={cmd.id}
                variant="outline"
                size="sm"
                className="h-auto py-2 justify-start"
                onClick={() => runSearch(cmd)}
                disabled={isSearching}
              >
                <Search className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="text-xs font-medium">{cmd.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Command */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Custom Bridge Command</div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter bash command to run on Mac..."
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              className="font-mono text-sm"
              onKeyDown={(e) => e.key === 'Enter' && runCustomCommand()}
            />
            <Button onClick={runCustomCommand} disabled={isSearching}>
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Terminal className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>Found Files ({searchResults.length})</span>
              <Badge variant="outline">{searchResults.length} results</Badge>
            </div>
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              <div className="space-y-1">
                {searchResults.map((file, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/50 ${
                      selectedFile === file.path ? 'bg-primary/10 border border-primary/30' : ''
                    }`}
                    onClick={() => readFile(file.path)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="truncate">
                        <div className="font-medium text-sm truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{file.path}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">{file.type}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Command Output */}
        {commandOutput && (
          <div>
            <div className="text-sm font-medium mb-2">Command Output</div>
            <ScrollArea className="h-[200px] border rounded-lg">
              <pre className="p-3 text-xs font-mono whitespace-pre-wrap">{commandOutput}</pre>
            </ScrollArea>
          </div>
        )}

        {/* File Content Preview */}
        {fileContent && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>File Preview: {selectedFile?.split('/').pop()}</span>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import to Supabase
              </Button>
            </div>
            <ScrollArea className="h-[300px] border rounded-lg">
              <pre className="p-3 text-xs font-mono whitespace-pre-wrap">{fileContent}</pre>
            </ScrollArea>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 rounded-lg bg-muted/30 text-sm">
          <div className="font-medium mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Looking for Neural Ennead Data?
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use "Find 4500 Roles" to locate your roles document</li>
            <li>• Use "Find Large CSVs" for data files with worker lists</li>
            <li>• Click any found file to preview its contents</li>
            <li>• CSV files can be imported directly to Supabase</li>
            <li>• The 9×9×9 structure = 729 workers across 9 divisions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BridgeDataFinder;
