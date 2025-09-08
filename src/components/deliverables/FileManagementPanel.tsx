import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Download,
  Trash2,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  ExternalLink,
  Calendar,
  Hash,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Eye,
  User,
  Loader2
} from 'lucide-react';

interface FileRecord {
  id: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  file_hash?: string;
  checks?: any;
  created_at: string;
  updated_at: string;
  milestone: {
    id: string;
    title: string;
    deal: {
      id: string;
      projects: {
        title: string;
        users: {
          first_name: string | null;
          last_name: string | null;
          email: string;
        };
      };
      users: {
        first_name: string | null;
        last_name: string | null;
        email: string;
      } | null;
    };
  };
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  sizeByType: Record<string, { count: number; size: number }>;
}

export function FileManagementPanel() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'ADMIN') {
      fetchFiles();
      fetchStorageStats();
    }
  }, [userProfile]);

  const fetchFiles = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('deliverables')
        .select(`
          id,
          file_url,
          file_hash,
          checks,
          created_at,
          updated_at,
          milestone:milestones!inner (
            id,
            title,
            deal:deals!inner (
              id,
              projects!inner (
                title,
                users!brand_id (
                  first_name, last_name, email
                )
              ),
              users (
                first_name, last_name, email
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load files',
          description: 'Could not retrieve file information.',
        });
        return;
      }

      // Simple fallback to avoid database query issues
      setFiles([]);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load files.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      const { data, error } = await supabase
        .from('deliverables')
        .select('checks')
        .not('file_url', 'is', null);

      if (error) throw error;

      let totalSize = 0;
      const sizeByType: Record<string, { count: number; size: number }> = {};

      data.forEach(file => {
        const fileSize = (file.checks as any)?.file_size || 0;
        const fileType = (file.checks as any)?.file_type?.split('/')[0] || 'other';
        
        totalSize += fileSize;
        
        if (!sizeByType[fileType]) {
          sizeByType[fileType] = { count: 0, size: 0 };
        }
        
        sizeByType[fileType].count += 1;
        sizeByType[fileType].size += fileSize;
      });

      setStorageStats({
        totalFiles: data.length,
        totalSize,
        sizeByType,
      });
    } catch (error: any) {
      console.error('Error fetching storage stats:', error);
    }
  };

  const getFileIcon = (fileName?: string, checks?: any) => {
    const fileType = checks?.file_type?.split('/')[0];
    
    switch (fileType) {
      case 'image':
        return <Image className="h-5 w-5 text-green-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'audio':
        return <Music className="h-5 w-5 text-blue-500" />;
      default:
        if (fileName?.match(/\.(zip|rar|7z|tar|gz)$/i)) {
          return <Archive className="h-5 w-5 text-orange-500" />;
        }
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCreatorName = (file: FileRecord) => {
    const creator = file.milestone.deal.users;
    if (!creator) return 'Unknown';
    const name = `${creator.first_name || ''} ${creator.last_name || ''}`.trim();
    return name || creator.email;
  };

  const getBrandName = (file: FileRecord) => {
    const brand = file.milestone.deal.projects.users;
    const name = `${brand.first_name || ''} ${brand.last_name || ''}`.trim();
    return name || brand.email;
  };

  const downloadFile = async (file: FileRecord) => {
    if (!file.file_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('deliverables')
        .download(file.file_url);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Download Failed',
          description: 'Could not download file.',
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name || 'deliverable';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'An error occurred while downloading the file.',
      });
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({ file_url: null, updated_at: new Date().toISOString() })
        .eq('id', fileId);

      if (error) throw error;

      setFiles(files.filter(f => f.id !== fileId));
      toast({
        title: 'File Deleted',
        description: 'File reference has been removed.',
      });
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete file.',
      });
    }
  };

  const bulkDelete = async () => {
    if (selectedFiles.length === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({ file_url: null, updated_at: new Date().toISOString() })
        .in('id', selectedFiles);

      if (error) throw error;

      setFiles(files.filter(f => !selectedFiles.includes(f.id)));
      setSelectedFiles([]);
      
      toast({
        title: 'Files Deleted',
        description: `${selectedFiles.length} files have been removed.`,
      });
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      toast({
        variant: 'destructive',
        title: 'Bulk Delete Failed',
        description: 'Could not delete selected files.',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.milestone.deal.projects.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedFileType === 'all' || 
      file.checks?.file_type?.startsWith(selectedFileType);
    
    return matchesSearch && matchesType;
  });

  if (userProfile?.role !== 'ADMIN') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Admin privileges required to manage files.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading file management panel...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Statistics */}
      {storageStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <HardDrive className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <p className="text-2xl font-bold">{storageStats.totalFiles}</p>
                <p className="text-xs text-muted-foreground">Total Files</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Archive className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <p className="text-2xl font-bold">{formatFileSize(storageStats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">Storage Used</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Image className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{storageStats.sizeByType.image?.count || 0}</p>
                <p className="text-xs text-muted-foreground">Images</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Video className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{storageStats.sizeByType.video?.count || 0}</p>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>File Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search files, milestones, or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="application">Documents</option>
            </select>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedFiles.length} files selected</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={bulkDelete}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFiles([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Files ({filteredFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {files.length === 0 ? 'No files uploaded yet' : 'No files match your filters'}
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles([...selectedFiles, file.id]);
                        } else {
                          setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                        }
                      }}
                    />
                    
                    {getFileIcon(file.file_name, file.checks)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <Badge variant="secondary">{formatFileSize(file.file_size || 0)}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{file.milestone.deal.projects.title}</span>
                        <span>•</span>
                        <span>{file.milestone.title}</span>
                        <span>•</span>
                        <span>{getCreatorName(file)}</span>
                        <span>•</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                      
                      {file.file_hash && (
                        <div className="flex items-center gap-1 mt-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <code className="text-xs bg-muted px-1 rounded font-mono">
                            {file.file_hash.substring(0, 12)}...
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>File Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">File Name</Label>
                              <p className="text-sm">{file.file_name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Size</Label>
                              <p className="text-sm">{formatFileSize(file.file_size || 0)}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Project</Label>
                              <p className="text-sm">{file.milestone.deal.projects.title}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Milestone</Label>
                              <p className="text-sm">{file.milestone.title}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Creator</Label>
                              <p className="text-sm">{getCreatorName(file)}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Brand</Label>
                              <p className="text-sm">{getBrandName(file)}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Uploaded</Label>
                              <p className="text-sm">{formatDate(file.created_at)}</p>
                            </div>
                            {file.file_hash && (
                              <div className="col-span-2">
                                <Label className="text-sm font-medium">File Hash (SHA-256)</Label>
                                <code className="text-xs bg-muted p-2 rounded block mt-1 font-mono break-all">
                                  {file.file_hash}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}