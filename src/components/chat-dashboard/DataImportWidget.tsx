import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw,
  Database, Users, Building2, Briefcase, Download, Trash2, FileJson, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportedData {
  fileName: string;
  rowCount: number;
  columns: string[];
  data: any[];
  importedAt: Date;
}

interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

const DataImportWidget = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [targetTable, setTargetTable] = useState<string>("roles");
  const [existingTables, setExistingTables] = useState<TableInfo[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Predefined table schemas matching user's actual data
  const tableSchemas: Record<string, string[]> = {
    roles: [
      'group_name', 'exemplar', 'asset_id', 'asset_name', 'variant_id',
      'variant_name', 'time_state', 'signal_state', 'ai_trajectory_score',
      'lag_status', 'velocity', 'lens', 'status'
    ],
    agents: [
      'coordinates', 'variant_id', 'count', 'status_code', 'date',
      'status', 'location', 'schedule', 'api_url', 'auth_method',
      'priority', 'tags', 'event_id', 'next_run', 'action'
    ],
    workers: [
      'id', 'role_type', 'education', 'department', 'experience_years',
      'language_proficiencies', 'date_range', 'skills', 'category', 'level'
    ],
    work_styles: [
      'score_1', 'score_2', 'score_3', 'score_4', 'score_5', 'disc_profile',
      'work_style_combo', 'metric_1', 'metric_2', 'metric_3', 'metric_4',
      'metric_5', 'level', 'date', 'flag_1', 'flag_2', 'score_final'
    ],
    divisions: ['id', 'name', 'director', 'health', 'output', 'created_at'],
    teams: ['id', 'name', 'division_id', 'lead', 'health', 'output', 'created_at'],
    events: [
      'event_id', 'variant_id', 'location', 'status', 'api_url',
      'action', 'next_run', 'priority'
    ]
  };

  const loadExistingTables = async () => {
    setIsLoadingTables(true);
    try {
      // Try to get table info via RPC
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `
          SELECT
            tablename as name,
            (SELECT COUNT(*) FROM pg_attribute WHERE attrelid = (schemaname||'.'||tablename)::regclass AND attnum > 0 AND NOT attisdropped) as column_count
          FROM pg_tables
          WHERE schemaname = 'public'
          ORDER BY tablename
        `,
        params: {}
      });

      if (!error && data) {
        setExistingTables(data.map((t: any) => ({
          name: t.name,
          rowCount: 0,
          columns: []
        })));
      }
    } catch (e) {
      console.error('Failed to load tables:', e);
    }
    setIsLoadingTables(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'csv' || ext === 'tsv') {
        // Parse CSV/TSV file
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          delimiter: ext === 'tsv' ? '\t' : ',',
          complete: (results) => {
            setUploadProgress(50);
            processData(file.name, results.data as any[], results.meta.fields || []);
          },
          error: (error) => {
            console.error('Parse error:', error);
            setIsUploading(false);
            toast({
              title: "Parse Error",
              description: error.message,
              variant: "destructive"
            });
          }
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        setUploadProgress(30);

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        setUploadProgress(50);

        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error('Excel file appears to be empty');
        }

        // First row is headers
        const headers = jsonData[0].map((h: any) => String(h || '').trim());
        const rows = jsonData.slice(1).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx] ?? '';
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== ''));

        processData(file.name, rows, headers);

        toast({
          title: "Excel Parsed",
          description: `Sheet "${sheetName}" - ${rows.length} rows`,
        });
      } else if (ext === 'json') {
        // Parse JSON file
        const text = await file.text();
        setUploadProgress(30);

        let jsonData = JSON.parse(text);

        // Handle both array and object with data property
        if (!Array.isArray(jsonData)) {
          jsonData = jsonData.data || jsonData.rows || jsonData.items || [jsonData];
        }

        if (jsonData.length === 0) {
          throw new Error('JSON file appears to be empty');
        }

        setUploadProgress(50);

        // Get columns from first object
        const columns = Object.keys(jsonData[0]);

        processData(file.name, jsonData, columns);
      } else {
        throw new Error(`Unsupported file type: .${ext}. Use CSV, Excel, or JSON.`);
      }
    } catch (e: any) {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  const processData = (fileName: string, data: any[], columns: string[]) => {
    setImportedData({
      fileName,
      rowCount: data.length,
      columns,
      data,
      importedAt: new Date()
    });

    setPreviewData(data.slice(0, 10));
    setUploadProgress(100);
    setIsUploading(false);

    toast({
      title: "File Parsed Successfully",
      description: `${data.length} rows with ${columns.length} columns`,
    });
  };

  const importToSupabase = async () => {
    if (!importedData) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const batchSize = 100;
      const totalBatches = Math.ceil(importedData.data.length / batchSize);
      let imported = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = importedData.data.slice(i * batchSize, (i + 1) * batchSize);

        const { error } = await supabase
          .from(targetTable)
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          throw new Error(`Batch ${i + 1} failed: ${error.message}`);
        }

        imported += batch.length;
        setUploadProgress(Math.round((imported / importedData.data.length) * 100));
      }

      toast({
        title: "Import Complete",
        description: `${imported} rows imported to ${targetTable}`,
      });

      setIsUploading(false);
    } catch (e: any) {
      setIsUploading(false);
      toast({
        title: "Import Failed",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  const clearData = () => {
    setImportedData(null);
    setPreviewData([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const schema = tableSchemas[targetTable] || tableSchemas.workers;
    const csv = schema.join(',') + '\n' + schema.map(() => '').join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetTable}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Data Import
            </CardTitle>
            <CardDescription>Import CSV files with 4500+ roles/workers for Neural Ennead</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadExistingTables} disabled={isLoadingTables}>
            {isLoadingTables ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Load Tables
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Table Selection */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Target Table</label>
            <Select value={targetTable} onValueChange={setTargetTable}>
              <SelectTrigger>
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roles">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    roles (4500 roles - exemplar/variant/trajectory)
                  </div>
                </SelectItem>
                <SelectItem value="agents">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    agents (10K events - location/status/action)
                  </div>
                </SelectItem>
                <SelectItem value="workers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    workers (education/skills/department)
                  </div>
                </SelectItem>
                <SelectItem value="work_styles">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    work_styles (DISC/personality scores)
                  </div>
                </SelectItem>
                <SelectItem value="events">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    events (EV IDs - invoke/terminate/monitor)
                  </div>
                </SelectItem>
                <SelectItem value="divisions">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    divisions (9 Neural Ennead divisions)
                  </div>
                </SelectItem>
                <SelectItem value="teams">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    teams (81 teams)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>
        </div>

        {/* Expected Schema */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="text-xs font-medium mb-2">Expected Columns for {targetTable}:</div>
          <div className="flex flex-wrap gap-1">
            {(tableSchemas[targetTable] || []).map(col => (
              <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full h-28 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-6 h-6 text-green-500" />
                  <FileJson className="w-6 h-6 text-yellow-500" />
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <span className="font-medium">Click to upload your 4500 roles file</span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">.xlsx</Badge>
                  <Badge variant="outline" className="text-xs">.csv</Badge>
                  <Badge variant="outline" className="text-xs">.json</Badge>
                  <Badge variant="outline" className="text-xs">.xls</Badge>
                </div>
              </div>
            )}
          </Button>

          {isUploading && (
            <Progress value={uploadProgress} className="h-2" />
          )}
        </div>

        {/* Import Status */}
        {importedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium">{importedData.fileName}</div>
                  <div className="text-sm text-muted-foreground">
                    {importedData.rowCount.toLocaleString()} rows × {importedData.columns.length} columns
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearData}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={importToSupabase} disabled={isUploading}>
                  <Database className="w-4 h-4 mr-2" />
                  Import to {targetTable}
                </Button>
              </div>
            </div>

            {/* Column Mapping */}
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="text-sm font-medium mb-2">Detected Columns:</div>
              <div className="flex flex-wrap gap-1">
                {importedData.columns.map(col => (
                  <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div>
              <div className="text-sm font-medium mb-2">Preview (first 10 rows)</div>
              <ScrollArea className="h-[200px] border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr>
                      {importedData.columns.slice(0, 6).map(col => (
                        <th key={col} className="p-2 text-left border-b">{col}</th>
                      ))}
                      {importedData.columns.length > 6 && (
                        <th className="p-2 text-left border-b">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/30">
                        {importedData.columns.slice(0, 6).map(col => (
                          <td key={col} className="p-2 truncate max-w-[150px]">
                            {String(row[col] || '')}
                          </td>
                        ))}
                        {importedData.columns.length > 6 && (
                          <td className="p-2 text-muted-foreground">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Existing Tables */}
        {existingTables.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Existing Tables in Supabase</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {existingTables.map(table => (
                <div
                  key={table.name}
                  className="p-2 rounded bg-muted/30 text-sm flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-muted-foreground" />
                  {table.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataImportWidget;
