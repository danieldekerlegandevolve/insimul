import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  History,
  Image as ImageIcon,
  Archive,
  RotateCcw,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { VisualAsset } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface GenerationHistoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'character' | 'business' | 'settlement';
  entityId: string;
  entityName?: string;
  assetType?: string;
  onRegenerateFromHistory?: (asset: VisualAsset) => void;
}

export function GenerationHistoryViewer({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  assetType,
  onRegenerateFromHistory,
}: GenerationHistoryViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived' | 'all'>('active');

  // Fetch asset history
  const { data: assets = [], isLoading } = useQuery<VisualAsset[]>({
    queryKey: ['/api/entities', entityType, entityId, 'asset-history', { assetType, includeArchived: viewMode !== 'active' }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assetType) params.append('assetType', assetType);
      params.append('includeArchived', viewMode !== 'active' ? 'true' : 'false');

      const response = await apiRequest('GET', `/api/entities/${entityType}/${entityId}/asset-history?${params}`);
      return response.json();
    },
    enabled: open,
  });

  // Archive asset mutation
  const archiveAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiRequest('POST', `/api/assets/${assetId}/archive`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities', entityType, entityId, 'asset-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: 'Asset Archived',
        description: 'The asset has been moved to archive',
      });
    },
  });

  // Restore asset mutation
  const restoreAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiRequest('POST', `/api/assets/${assetId}/restore`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities', entityType, entityId, 'asset-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: 'Asset Restored',
        description: 'The asset has been restored from archive',
      });
    },
  });

  // Delete asset mutation (permanent)
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiRequest('DELETE', `/api/assets/${assetId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities', entityType, entityId, 'asset-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: 'Asset Deleted',
        description: 'The asset has been permanently deleted',
      });
    },
  });

  const toggleAssetSelection = (assetId: string) => {
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      if (compareMode && newSelection.size >= 4) {
        toast({
          title: 'Selection Limit',
          description: 'You can compare up to 4 assets at a time',
          variant: 'destructive',
        });
        return;
      }
      newSelection.add(assetId);
    }
    setSelectedAssets(newSelection);
  };

  const formatAssetType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'secondary',
      archived: 'outline',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
        {status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredAssets = assets.filter(asset => {
    if (viewMode === 'active') return asset.status !== 'archived';
    if (viewMode === 'archived') return asset.status === 'archived';
    return true;
  });

  const selectedAssetsList = Array.from(selectedAssets)
    .map(id => assets.find(a => a.id === id))
    .filter(Boolean) as VisualAsset[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Generation History
            {entityName && <span className="text-muted-foreground">· {entityName}</span>}
          </DialogTitle>
          <DialogDescription>
            View and manage all generated versions of visual assets
          </DialogDescription>
        </DialogHeader>

        {/* View mode tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="active">
                Active ({assets.filter(a => a.status !== 'archived').length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({assets.filter(a => a.status === 'archived').length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({assets.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {!compareMode && selectedAssets.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompareMode(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Compare ({selectedAssets.size})
                </Button>
              )}
              {compareMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompareMode(false);
                    setSelectedAssets(new Set());
                  }}
                >
                  Exit Compare Mode
                </Button>
              )}
            </div>
          </div>

          <TabsContent value={viewMode} className="flex-1 min-h-0 mt-4">
            {compareMode && selectedAssetsList.length > 0 ? (
              /* Comparison View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Comparing {selectedAssetsList.length} Assets</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on assets below to select/deselect them
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedAssetsList.map((asset, index) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="relative aspect-square">
                        <img
                          src={`/${asset.filePath}`}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-black/70 text-white">#{index + 1}</Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{asset.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {asset.generationProvider} · {asset.width}x{asset.height}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {asset.generationPrompt && (
                          <div className="text-xs">
                            <p className="font-medium text-muted-foreground mb-1">Prompt:</p>
                            <p className="line-clamp-2">{asset.generationPrompt}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => toggleAssetSelection(asset.id)}
                        >
                          Remove from Comparison
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* Timeline View */
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading history...</div>
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mb-2 opacity-20" />
                    <p>No generation history found</p>
                  </div>
                ) : (
                  <div className="space-y-4 pr-4">
                    {filteredAssets.map((asset, index) => {
                      const isSelected = selectedAssets.has(asset.id);
                      const isFirst = index === 0;

                      return (
                        <div key={asset.id}>
                          {index > 0 && <Separator className="my-4" />}
                          <Card className={isSelected ? 'ring-2 ring-primary' : ''}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CardTitle className="text-base">{asset.name}</CardTitle>
                                    {isFirst && asset.status !== 'archived' && (
                                      <Badge variant="default">Current</Badge>
                                    )}
                                    {getStatusBadge(asset.status)}
                                  </div>
                                  <CardDescription className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(asset.createdAt).toLocaleString()}
                                    <span className="text-xs">
                                      ({formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })})
                                    </span>
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Asset Preview */}
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={`/${asset.filePath}`}
                                    alt={asset.name}
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => window.open(`/${asset.filePath}`, '_blank')}
                                  />
                                </div>

                                {/* Asset Details */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                                    <p className="text-sm">{formatAssetType(asset.assetType)}</p>
                                  </div>

                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                                    <p className="text-sm">{asset.generationProvider || 'N/A'}</p>
                                  </div>

                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Dimensions</p>
                                    <p className="text-sm">{asset.width}x{asset.height}px</p>
                                  </div>

                                  {asset.generationPrompt && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Prompt</p>
                                      <p className="text-sm line-clamp-3">{asset.generationPrompt}</p>
                                    </div>
                                  )}

                                  {asset.metadata?.stylePresetId && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Style Preset</p>
                                      <p className="text-sm">{asset.metadata.stylePresetId}</p>
                                    </div>
                                  )}

                                  {asset.tags && asset.tags.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground mb-1">Tags</p>
                                      <div className="flex flex-wrap gap-1">
                                        {asset.tags.map((tag) => (
                                          <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleAssetSelection(asset.id)}
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Selected
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Select for Compare
                                    </>
                                  )}
                                </Button>

                                {onRegenerateFromHistory && asset.generationPrompt && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onRegenerateFromHistory(asset)}
                                  >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Regenerate with Same Settings
                                  </Button>
                                )}

                                {asset.status === 'archived' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => restoreAssetMutation.mutate(asset.id)}
                                    disabled={restoreAssetMutation.isPending}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restore
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => archiveAssetMutation.mutate(asset.id)}
                                    disabled={archiveAssetMutation.isPending}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </Button>
                                )}

                                {asset.status === 'archived' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm('Are you sure? This will permanently delete the asset.')) {
                                        deleteAssetMutation.mutate(asset.id);
                                      }
                                    }}
                                    disabled={deleteAssetMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Permanently
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
