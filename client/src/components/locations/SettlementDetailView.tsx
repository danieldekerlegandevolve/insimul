import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPinned, MapPin, Building2, Users, Home, Trash2, ChevronRight, Plus, Sparkles, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2, Layers, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Character, VisualAsset } from '@shared/schema';
import { VisualAssetGeneratorDialog } from '../VisualAssetGeneratorDialog';
import { AssetBrowserDialog } from '../AssetBrowserDialog';
import { JobQueueViewer } from '../JobQueueViewer';

interface SettlementDetailViewProps {
  settlement: any;
  lots: any[];
  businesses: any[];
  residences: any[];
  characters: Character[];
  onViewCharacter: (character: Character) => void;
  onDeleteSettlement?: () => void;
  onDeleteLot?: (lotId: string) => void;
  onDeleteBusiness?: (businessId: string) => void;
  onDeleteResidence?: (residenceId: string) => void;
  onAddCharacter?: () => void;
  onAddLot?: () => void;
  onAddBusiness?: () => void;
  onAddResidence?: () => void;
}

export function SettlementDetailView({
  settlement,
  lots,
  businesses,
  residences,
  characters,
  onViewCharacter,
  onDeleteSettlement,
  onDeleteLot,
  onDeleteBusiness,
  onDeleteResidence,
  onAddCharacter,
  onAddLot,
  onAddBusiness,
  onAddResidence
}: SettlementDetailViewProps) {
  const [showAssetGenerator, setShowAssetGenerator] = useState(false);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);
  const [showJobQueue, setShowJobQueue] = useState(false);
  const [assetType, setAssetType] = useState<'map_terrain' | 'map_political' | 'map_region'>('map_terrain');
  const [mapZoom, setMapZoom] = useState(1);
  const [activeMapTab, setActiveMapTab] = useState<'terrain' | 'political' | 'regional'>('terrain');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Batch generate character portraits mutation
  const batchGeneratePortraitsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/settlements/${settlement.id}/queue-batch-portraits`, {
        provider: 'flux',
        params: {}
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: 'Batch Generation Queued',
        description: result.message,
      });
      setShowJobQueue(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Queue Batch Generation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Batch generate building exteriors mutation
  const batchGenerateBuildingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/settlements/${settlement.id}/queue-batch-buildings`, {
        provider: 'flux',
        params: {}
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: 'Batch Generation Queued',
        description: result.message,
      });
      setShowJobQueue(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Queue Batch Generation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch settlement visual assets
  const { data: settlementAssets = [] } = useQuery<VisualAsset[]>({
    queryKey: ['/api/assets', 'settlement', settlement.id],
  });

  // Organize maps by type
  const maps = useMemo(() => {
    return {
      terrain: settlementAssets.find(a => a.assetType === 'map_terrain'),
      political: settlementAssets.find(a => a.assetType === 'map_political'),
      regional: settlementAssets.find(a => a.assetType === 'map_region')
    };
  }, [settlementAssets]);

  const handleGenerateMap = (mapType: 'map_terrain' | 'map_political' | 'map_region') => {
    setAssetType(mapType);
    setShowAssetGenerator(true);
  };

  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setMapZoom(1);

  return (
    <div className="space-y-6">
      {/* Settlement Info Card */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MapPinned className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {settlement.name}
                  <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                    {settlement.settlementType}
                  </span>
                </CardTitle>
                <CardDescription>{settlement.description}</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJobQueue(true)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Queue
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Population</span>
              <p className="font-semibold text-lg">{settlement.population?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Terrain</span>
              <p className="font-semibold">{settlement.terrain}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Founded</span>
              <p className="font-semibold">{settlement.foundedYear || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Generation</span>
              <p className="font-semibold">{settlement.currentGeneration || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlement Maps Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Settlement Maps
            </CardTitle>
            <Button onClick={() => setShowAssetBrowser(true)} variant="outline" size="sm">
              <ImageIcon className="w-4 h-4 mr-2" />
              Browse All ({settlementAssets.length})
            </Button>
          </div>
          <CardDescription>
            AI-generated maps showing terrain, political boundaries, and regional context
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(maps.terrain || maps.political || maps.regional) ? (
            <Tabs value={activeMapTab} onValueChange={(v) => setActiveMapTab(v as any)}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="terrain" disabled={!maps.terrain}>
                    Terrain {maps.terrain && '✓'}
                  </TabsTrigger>
                  <TabsTrigger value="political" disabled={!maps.political}>
                    Political {maps.political && '✓'}
                  </TabsTrigger>
                  <TabsTrigger value="regional" disabled={!maps.regional}>
                    Regional {maps.regional && '✓'}
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={mapZoom <= 0.5}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetZoom}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={mapZoom >= 3}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Badge variant="secondary">{Math.round(mapZoom * 100)}%</Badge>
                </div>
              </div>

              <TabsContent value="terrain" className="mt-0">
                {maps.terrain ? (
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <div className="overflow-auto max-h-[600px]" style={{ cursor: 'grab' }}>
                      <img
                        src={`/${maps.terrain.filePath}`}
                        alt={maps.terrain.name}
                        style={{ transform: `scale(${mapZoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}
                        className="w-full"
                      />
                    </div>
                    <div className="p-3 bg-background border-t">
                      <p className="text-sm font-medium">{maps.terrain.name}</p>
                      {maps.terrain.generationProvider && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Sparkles className="h-3 w-3" />
                          Generated by {maps.terrain.generationProvider}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No terrain map yet</p>
                      <Button onClick={() => handleGenerateMap('map_terrain')} size="sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Terrain Map
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="political" className="mt-0">
                {maps.political ? (
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <div className="overflow-auto max-h-[600px]" style={{ cursor: 'grab' }}>
                      <img
                        src={`/${maps.political.filePath}`}
                        alt={maps.political.name}
                        style={{ transform: `scale(${mapZoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}
                        className="w-full"
                      />
                    </div>
                    <div className="p-3 bg-background border-t">
                      <p className="text-sm font-medium">{maps.political.name}</p>
                      {maps.political.generationProvider && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Sparkles className="h-3 w-3" />
                          Generated by {maps.political.generationProvider}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No political map yet</p>
                      <Button onClick={() => handleGenerateMap('map_political')} size="sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Political Map
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="regional" className="mt-0">
                {maps.regional ? (
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <div className="overflow-auto max-h-[600px]" style={{ cursor: 'grab' }}>
                      <img
                        src={`/${maps.regional.filePath}`}
                        alt={maps.regional.name}
                        style={{ transform: `scale(${mapZoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}
                        className="w-full"
                      />
                    </div>
                    <div className="p-3 bg-background border-t">
                      <p className="text-sm font-medium">{maps.regional.name}</p>
                      {maps.regional.generationProvider && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Sparkles className="h-3 w-3" />
                          Generated by {maps.regional.generationProvider}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No regional map yet</p>
                      <Button onClick={() => handleGenerateMap('map_region')} size="sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Regional Map
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No maps yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate maps to visualize this settlement
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateMap('map_terrain')} variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Terrain Map
                  </Button>
                  <Button onClick={() => handleGenerateMap('map_political')} variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Political Map
                  </Button>
                  <Button onClick={() => handleGenerateMap('map_region')} variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Regional Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Characters Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Characters ({characters.length})
          </h3>
          <div className="flex items-center gap-2">
            {characters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchGeneratePortraitsMutation.mutate()}
                disabled={batchGeneratePortraitsMutation.isPending}
              >
                <Layers className="w-4 h-4 mr-2" />
                Batch Generate Portraits
              </Button>
            )}
            {onAddCharacter && (
              <Button onClick={onAddCharacter} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Character
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          {characters.slice(0, 10).map((character) => (
            <Card
              key={character.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => onViewCharacter(character)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">
                        {character.firstName} {character.lastName}
                      </CardTitle>
                      <CardDescription>
                        {character.occupation || 'No occupation'} • Age: {character.birthYear ? new Date().getFullYear() - character.birthYear : 'Unknown'}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          ))}
          {characters.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm text-muted-foreground text-center">
                  No characters yet. Click "Add Character" to create one.
                </p>
              </CardContent>
            </Card>
          )}
          {characters.length > 10 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing 10 of {characters.length} characters. Navigate to Characters view to see all.
            </p>
          )}
        </div>
      </div>

      {/* Lots Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Lots ({lots.length})
          </h3>
          {onAddLot && (
            <Button onClick={onAddLot} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Lot
            </Button>
          )}
        </div>
        <div className="grid gap-3">
          {lots.map((lot) => (
            <Card key={lot.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{lot.address}</CardTitle>
                    <CardDescription>District: {lot.districtName || 'None'}</CardDescription>
                  </div>
                  {onDeleteLot && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLot(lot.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
          {lots.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm text-muted-foreground text-center">
                  No lots yet. Use procedural generation to create lots.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Businesses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Businesses ({businesses.length})
          </h3>
          <div className="flex items-center gap-2">
            {businesses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchGenerateBuildingsMutation.mutate()}
                disabled={batchGenerateBuildingsMutation.isPending}
              >
                <Layers className="w-4 h-4 mr-2" />
                Batch Generate Buildings
              </Button>
            )}
            {onAddBusiness && (
              <Button onClick={onAddBusiness} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </Button>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {businesses.map((business) => {
            // Fetch visual assets for this business
            const { data: businessAssets = [] } = useQuery<any[]>({
              queryKey: ['/api/assets/business', business.id],
              queryFn: async () => {
                const response = await apiRequest('GET', `/api/assets/business/${business.id}`);
                return response.json();
              },
            });

            const exterior = businessAssets.find(a => a.assetType === 'building_exterior');

            return (
              <Card key={business.id} className="overflow-hidden">
                {/* Building Exterior Image */}
                {exterior && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={`/${exterior.filePath}`}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{business.name}</CardTitle>
                        <CardDescription>{business.businessType}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!exterior && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await apiRequest('POST', `/api/businesses/${business.id}/generate-exterior`, {
                                provider: 'flux',
                              });
                              toast({
                                title: 'Generation Started',
                                description: 'Building exterior is being generated',
                              });
                            } catch (error) {
                              toast({
                                title: 'Generation Failed',
                                description: 'Failed to start generation',
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      )}
                      {onDeleteBusiness && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBusiness(business.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
          {businesses.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm text-muted-foreground text-center">
                  No businesses yet. Click "Add Business" to create one.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Residences Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Residences ({residences.length})
          </h3>
          {onAddResidence && (
            <Button onClick={onAddResidence} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Residence
            </Button>
          )}
        </div>
        <div className="grid gap-3">
          {residences.map((residence) => (
            <Card key={residence.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{residence.address || 'Residence'}</CardTitle>
                      <CardDescription>
                        {residence.residents?.length || 0} resident{residence.residents?.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  {onDeleteResidence && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteResidence(residence.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
          {residences.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm text-muted-foreground text-center">
                  No residences yet. Click "Add Residence" to create one.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Asset Generator Dialog */}
      <VisualAssetGeneratorDialog
        open={showAssetGenerator}
        onOpenChange={setShowAssetGenerator}
        entityType="settlement"
        entityId={settlement.id}
        entityName={settlement.name}
        assetType={assetType}
        onAssetGenerated={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/assets', 'settlement', settlement.id] });
        }}
      />

      {/* Asset Browser Dialog */}
      <AssetBrowserDialog
        open={showAssetBrowser}
        onOpenChange={setShowAssetBrowser}
        entityType="settlement"
        entityId={settlement.id}
      />

      {/* Job Queue Viewer */}
      <JobQueueViewer
        open={showJobQueue}
        onOpenChange={setShowJobQueue}
        worldId={settlement.worldId}
      />
    </div>
  );
}
