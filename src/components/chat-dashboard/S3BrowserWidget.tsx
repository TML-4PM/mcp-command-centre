import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Cloud, Folder, File, FileText, FileCode, Image, Video,
  Download, ExternalLink, RefreshCw, ChevronRight, ChevronDown,
  Search, HardDrive, Archive, Clock, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface S3Item {
  key: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: Date;
  fileType?: 'json' | 'html' | 'csv' | 'image' | 'video' | 'other';
}

interface S3Bucket {
  name: string;
  region: string;
  url?: string;
  itemCount: number;
  totalSize: string;
  lastSync: Date;
}

const S3BrowserWidget = () => {
  const { toast } = useToast();
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [currentBucket, setCurrentBucket] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [items, setItems] = useState<S3Item[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    // Mock S3 buckets based on context
    setBuckets([
      {
        name: 'troy-intelligence-dashboard',
        region: 'ap-southeast-2',
        url: 'http://troy-intelligence-dashboard.s3-website-ap-southeast-2.amazonaws.com/',
        itemCount: 1247,
        totalSize: '2.3 GB',
        lastSync: new Date(Date.now() - 3600000)
      },
      {
        name: 'troy-chat-exports',
        region: 'ap-southeast-2',
        itemCount: 5632,
        totalSize: '8.7 GB',
        lastSync: new Date(Date.now() - 7200000)
      },
      {
        name: 'troy-reports-archive',
        region: 'ap-southeast-2',
        itemCount: 892,
        totalSize: '1.2 GB',
        lastSync: new Date(Date.now() - 86400000)
      },
      {
        name: 'mcp-bridge-assets',
        region: 'ap-southeast-2',
        itemCount: 423,
        totalSize: '456 MB',
        lastSync: new Date(Date.now() - 1800000)
      }
    ]);
  };

  const browseBucket = async (bucketName: string) => {
    setIsLoading(true);
    setCurrentBucket(bucketName);
    setCurrentPath([]);

    // Mock folder structure
    setTimeout(() => {
      setItems([
        { key: 'dashboards/', name: 'dashboards', type: 'folder' },
        { key: 'exports/', name: 'exports', type: 'folder' },
        { key: 'reports/', name: 'reports', type: 'folder' },
        { key: 'conversations/', name: 'conversations', type: 'folder' },
        { key: 'assets/', name: 'assets', type: 'folder' },
        { key: 'index.html', name: 'index.html', type: 'file', size: 45230, lastModified: new Date(Date.now() - 3600000), fileType: 'html' },
        { key: 'config.json', name: 'config.json', type: 'file', size: 1234, lastModified: new Date(Date.now() - 7200000), fileType: 'json' },
        { key: 'domain_status.html', name: 'domain_status.html', type: 'file', size: 23456, lastModified: new Date(Date.now() - 86400000), fileType: 'html' }
      ]);
      setIsLoading(false);
    }, 500);
  };

  const browseFolder = async (folderKey: string) => {
    setIsLoading(true);
    setCurrentPath([...currentPath, folderKey.replace('/', '')]);

    // Mock subfolder contents
    setTimeout(() => {
      setItems([
        { key: `${folderKey}subfolder1/`, name: 'subfolder1', type: 'folder' },
        { key: `${folderKey}subfolder2/`, name: 'subfolder2', type: 'folder' },
        { key: `${folderKey}data.json`, name: 'data.json', type: 'file', size: 12345, lastModified: new Date(), fileType: 'json' },
        { key: `${folderKey}report.html`, name: 'report.html', type: 'file', size: 34567, lastModified: new Date(Date.now() - 3600000), fileType: 'html' },
        { key: `${folderKey}export.csv`, name: 'export.csv', type: 'file', size: 89012, lastModified: new Date(Date.now() - 7200000), fileType: 'csv' }
      ]);
      setIsLoading(false);
    }, 300);
  };

  const goBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      // Re-fetch parent folder contents
    } else {
      setCurrentBucket(null);
      setItems([]);
    }
  };

  const getFileIcon = (item: S3Item) => {
    if (item.type === 'folder') return <Folder className="w-5 h-5 text-yellow-500" />;
    switch (item.fileType) {
      case 'json': return <FileCode className="w-5 h-5 text-green-500" />;
      case 'html': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'csv': return <File className="w-5 h-5 text-blue-500" />;
      case 'image': return <Image className="w-5 h-5 text-purple-500" />;
      case 'video': return <Video className="w-5 h-5 text-pink-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const downloadItem = (item: S3Item) => {
    toast({
      title: "Download Started",
      description: `Downloading ${item.name}...`,
    });
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Bucket selection view
  if (!currentBucket) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                S3 Browser
              </CardTitle>
              <CardDescription>Browse and manage your S3 buckets and files</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchBuckets}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buckets.map(bucket => (
              <Card
                key={bucket.name}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => browseBucket(bucket.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Archive className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-semibold">{bucket.name}</div>
                        <div className="text-xs text-muted-foreground">{bucket.region}</div>
                      </div>
                    </div>
                    {bucket.url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={bucket.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Items</div>
                      <div className="font-medium">{bucket.itemCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Size</div>
                      <div className="font-medium">{bucket.totalSize}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Last sync: {bucket.lastSync.toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // File browser view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-500" />
                {currentBucket}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                {currentPath.length > 0 && (
                  <>
                    <span>/ </span>
                    {currentPath.map((p, i) => (
                      <span key={i}>
                        {p}
                        {i < currentPath.length - 1 && ' / '}
                      </span>
                    ))}
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48"
              />
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {filteredItems.map(item => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                    item.type === 'folder' ? 'hover:bg-yellow-500/5' : ''
                  }`}
                  onClick={() => item.type === 'folder' && browseFolder(item.key)}
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(item)}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.type === 'file' && (
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span>{formatSize(item.size)}</span>
                          {item.lastModified && (
                            <span>{item.lastModified.toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.fileType && (
                      <Badge variant="outline" className="text-xs">{item.fileType}</Badge>
                    )}
                    {item.type === 'file' ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); downloadItem(item); }}>
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default S3BrowserWidget;
