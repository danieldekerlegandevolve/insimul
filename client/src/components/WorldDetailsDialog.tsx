import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Globe, Edit3, Trash2, Save, X, Info, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VisualAssetGeneratorDialog } from './VisualAssetGeneratorDialog';
import { AssetBrowserDialog } from './AssetBrowserDialog';
import { BatchGenerationDialog } from './BatchGenerationDialog';
import type { World, VisualAsset } from '@shared/schema';

interface WorldDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  world: World | null;
  onWorldUpdated: () => void;
  onWorldDeleted: () => void;
}

export function WorldDetailsDialog({
  open,
  onOpenChange,
  world,
  onWorldUpdated,
  onWorldDeleted
}: WorldDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Geographical data
  const [countries, setCountries] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [totalPopulation, setTotalPopulation] = useState(0);

  // Visual Assets state
  const [showAssetGenerator, setShowAssetGenerator] = useState(false);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);
  const [showBatchGeneration, setShowBatchGeneration] = useState(false);
  const [assetType, setAssetType] = useState<'texture_ground' | 'texture_wall' | 'texture_material'>('texture_ground');

  // Fetch world visual assets
  const { data: worldAssets = [] } = useQuery<VisualAsset[]>({
    queryKey: ['/api/worlds', world?.id, 'assets'],
    enabled: !!world?.id && open
  });

  // Load world data when dialog opens
  useEffect(() => {
    if (world) {
      setName(world.name);
      setDescription(world.description || '');
      
      // Fetch countries and settlements
      fetchGeographicalData(world.id);
    }
  }, [world]);
  
  // Fetch countries and settlements for this world
  const fetchGeographicalData = async (worldId: string) => {
    try {
      const [countriesRes, settlementsRes] = await Promise.all([
        fetch(`/api/worlds/${worldId}/countries`),
        fetch(`/api/worlds/${worldId}/settlements`)
      ]);
      
      if (countriesRes.ok && settlementsRes.ok) {
        const countriesData = await countriesRes.json();
        const settlementsData = await settlementsRes.json();
        
        setCountries(countriesData);
        setSettlements(settlementsData);
        
        // Calculate total population
        const total = settlementsData.reduce((sum: number, s: any) => sum + (s.population || 0), 0);
        setTotalPopulation(total);
      }
    } catch (error) {
      console.error('Failed to fetch geographical data:', error);
    }
  };

  const handleSave = async () => {
    if (!world) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/worlds/${world.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update world');
      }

      toast({
        title: 'World Updated',
        description: 'World information has been saved successfully'
      });

      setIsEditing(false);
      onWorldUpdated();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update world',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!world) return;

    try {
      const response = await fetch(`/api/worlds/${world.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete world');
      }

      toast({
        title: 'World Deleted',
        description: `${world.name} has been permanently deleted`
      });

      onWorldDeleted();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete world',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = () => {
    if (world) {
      // Reset to original values
      setName(world.name);
      setDescription(world.description || '');
    }
    setIsEditing(false);
  };

  if (!world) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {isEditing ? 'Edit World' : 'World Details'}
              </DialogTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !name.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <DialogDescription>
              {isEditing ? 'Edit world information and settings' : 'View detailed information about this world'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="assets">
                <ImageIcon className="w-3 h-3 mr-1" />
                Visual Assets
                {worldAssets.length > 0 && <Badge className="ml-1" variant="secondary">{worldAssets.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="world-name">World Name *</Label>
                  {isEditing ? (
                    <Input
                      id="world-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter world name"
                    />
                  ) : (
                    <p className="text-sm font-medium">{world.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Total Population</Label>
                  <p className="text-sm font-medium">{totalPopulation.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Calculated from {settlements.length} settlement(s)</p>
                </div>

                <div className="space-y-2">
                  <Label>Countries</Label>
                  <p className="text-sm font-medium">{countries.length}</p>
                  <p className="text-xs text-muted-foreground">Nation-states in this world</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your world..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{world.description || 'No description provided'}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Countries ({countries.length})</h3>
                  {countries.length > 0 ? (
                    <div className="space-y-2">
                      {countries.map((country: any) => (
                        <div key={country.id} className="border rounded-lg p-3 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{country.name}</p>
                              <p className="text-xs text-muted-foreground">{country.description || 'No description'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                            <div>
                              <span className="text-muted-foreground">Government:</span> {country.governmentType || 'Not specified'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Economy:</span> {country.economicSystem || 'Not specified'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Founded:</span> {country.foundedYear || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No countries yet. Use the Generate tab to create settlements.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Settlements ({settlements.length})</h3>
                  {settlements.length > 0 ? (
                    <div className="space-y-2">
                      {settlements.map((settlement: any) => (
                        <div key={settlement.id} className="border rounded-lg p-3 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{settlement.name}</p>
                              <p className="text-xs text-muted-foreground">{settlement.description || 'No description'}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                              {settlement.settlementType}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                            <div>
                              <span className="text-muted-foreground">Population:</span> {settlement.population?.toLocaleString() || 0}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Terrain:</span> {settlement.terrain || 'Not specified'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Founded:</span> {settlement.foundedYear || 'Unknown'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Generation:</span> {settlement.currentGeneration || 0}/{settlement.maxGenerations || '?'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No settlements yet. Use the Generate tab to create settlements.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">AI-Generated Visual Assets</h3>
                    <p className="text-sm text-muted-foreground">Generate and manage visual assets for your world</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowBatchGeneration(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Batch Generation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssetBrowser(true)}
                      disabled={worldAssets.length === 0}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Browse All ({worldAssets.length})
                    </Button>
                  </div>
                </div>

                {/* Quick Generate Buttons */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Generate Textures for 3D Game
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssetType('texture_ground');
                            setShowAssetGenerator(true);
                          }}
                        >
                          <Sparkles className="w-3 h-3 mr-2" />
                          Ground Texture
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssetType('texture_wall');
                            setShowAssetGenerator(true);
                          }}
                        >
                          <Sparkles className="w-3 h-3 mr-2" />
                          Wall Texture
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssetType('texture_material');
                            setShowAssetGenerator(true);
                          }}
                        >
                          <Sparkles className="w-3 h-3 mr-2" />
                          Material Texture
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground">
                      <p>Generated textures will be available in the 3D game for applying to terrain, buildings, and objects.</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Assets Preview */}
                {worldAssets.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Assets ({worldAssets.length})</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {worldAssets.slice(0, 8).map(asset => (
                        <div key={asset.id} className="relative aspect-square rounded-md overflow-hidden border">
                          <img
                            src={`/${asset.filePath}`}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                            <p className="text-xs text-white truncate">{asset.assetType.replace('texture_', '')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {worldAssets.length > 8 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        +{worldAssets.length - 8} more. Click "Browse All" to see them.
                      </p>
                    )}
                  </div>
                )}

                {worldAssets.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="font-medium mb-1">No visual assets yet</p>
                      <p className="text-sm text-muted-foreground mb-4">Generate textures to use in your 3D world</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>System Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {world.sourceFormats && Array.isArray(world.sourceFormats) ? (
                      world.sourceFormats.map((type: string) => (
                        <span key={type} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {type}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No system types specified</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    World ID
                  </Label>
                  <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">{world.id}</p>
                </div>

                <div className="space-y-2">
                  <Label>Created At</Label>
                  <p className="text-sm">{world.createdAt ? new Date(world.createdAt).toLocaleString() : 'Unknown'}</p>
                </div>

                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <p className="text-sm">{world.updatedAt ? new Date(world.updatedAt).toLocaleString() : 'Unknown'}</p>
                </div>
              </div>

              {world.config && Object.keys(world.config).length > 0 && (
                <div className="space-y-2">
                  <Label>Configuration</Label>
                  <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(world.config, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Visual Asset Generator Dialog */}
      {world && (
        <VisualAssetGeneratorDialog
          open={showAssetGenerator}
          onOpenChange={setShowAssetGenerator}
          entityType="world"
          entityId={world.id}
          entityName={world.name}
          assetType={assetType}
          onAssetGenerated={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', world.id, 'assets'] });
          }}
        />
      )}

      {/* Asset Browser Dialog */}
      {world && (
        <AssetBrowserDialog
          open={showAssetBrowser}
          onOpenChange={setShowAssetBrowser}
          worldId={world.id}
        />
      )}

      {/* Batch Generation Dialog */}
      {world && (
        <BatchGenerationDialog
          open={showBatchGeneration}
          onOpenChange={setShowBatchGeneration}
          worldId={world.id}
          worldName={world.name}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete World?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{world.name}</strong>? This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All rule files</li>
                <li>All characters</li>
                <li>All actions</li>
                <li>All simulations</li>
                <li>All world data</li>
              </ul>
              <p className="mt-2 text-destructive font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete World
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
