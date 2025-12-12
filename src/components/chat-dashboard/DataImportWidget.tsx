import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw,
  Database, Users, Building2, Briefcase, Download, Trash2
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
  const [targetTable, setTargetTable] = useState<string>("workers");
  const [existingTables, setExistingTables] = useState<TableInfo[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Predefined table schemas for Neural Ennead
  const tableSchemas: Record<string, string[]> = {
    workers: ['id', 'name', 'role', 'status', 'division', 'team', 'efficiency', 'output', 'specialization', 'created_at'],
    divisions: ['id', 'name', 'director', 'health', 'output', 'created_at'],
    teams: ['id', 'name', 'division_id', 'lead', 'health', 'output', 'created_at'],
    roles: ['id', 'title', 'description', 'level', 'division', 'count', 'created_at']
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

    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setUploadProgress(50);

          const data = results.data as any[];
          const columns = results.meta.fields || [];

          setImportedData({
            fileName: file.name,
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
    } catch (e: any) {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: e.message,
        variant: "destructive"
      });
    }
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
                <SelectItem value="workers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    workers (Neural Ennead 729+)
                  </div>
                </SelectItem>
                <SelectItem value="divisions">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    divisions (9 divisions)
                  </div>
                </SelectItem>
                <SelectItem value="teams">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    teams (81 teams)
                  </div>
                </SelectItem>
                <SelectItem value="roles">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    roles (4500 roles)
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
            accept=".csv,.tsv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full h-24 border-dashed"
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
                <Upload className="w-6 h-6" />
                <span>Click to upload CSV (4500 roles, workers, etc.)</span>
                <span className="text-xs text-muted-foreground">Supports Neural Ennead 9×9×9 structure</span>
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
