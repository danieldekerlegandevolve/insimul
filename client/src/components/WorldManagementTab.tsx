import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, Users, Map, Info, Trash2, Settings, BarChart3, Lock } from 'lucide-react';
import { GenealogyViewer } from './visualization/GenealogyViewer';
import { GeographyMap } from './visualization/GeographyMap';
import { BaseResourcesConfig } from './BaseResourcesConfig';
import { PlaythroughAnalytics } from './PlaythroughAnalytics';
import { WorldSettingsDialog } from './WorldSettingsDialog';
import { useToast } from '@/hooks/use-toast';
import { useWorldPermissions } from '@/hooks/use-world-permissions';

interface WorldManagementTabProps {
  worldId: string;
  worldName?: string;
  onWorldDeleted?: () => void;
}

export function WorldManagementTab({ worldId, worldName, onWorldDeleted }: WorldManagementTabProps) {
  const [activeView, setActiveView] = useState<'overview' | 'genealogy' | 'map' | 'base-resources' | 'analytics'>('overview');
  const [settlements, setSettlements] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [totalPopulation, setTotalPopulation] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { canEdit, isOwner, loading } = useWorldPermissions(worldId);

  useEffect(() => {
    loadWorldData();
  }, [worldId]);

  const loadWorldData = async () => {
    try {
      const [countriesRes, settlementsRes] = await Promise.all([
        fetch(`/api/worlds/${worldId}/countries`),
        fetch(`/api/worlds/${worldId}/settlements`)
      ]);
      
      if (countriesRes.ok) {
        const countriesData = await countriesRes.json();
        setCountries(countriesData);
      }
      
      if (settlementsRes.ok) {
        const settlementsData = await settlementsRes.json();
        setSettlements(settlementsData);
        
        // Calculate total population
        const total = settlementsData.reduce((sum: number, s: any) => sum + (s.population || 0), 0);
        setTotalPopulation(total);
      }
    } catch (error) {
      console.error('Failed to load world data:', error);
    }
  };

  const handleDeleteWorld = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/worlds/${worldId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete world');
      }

      toast({
        title: 'World deleted',
        description: `World ${worldName || worldId} and all associated data have been permanently deleted.`,
      });

      // Call the parent callback to handle navigation
      if (onWorldDeleted) {
        onWorldDeleted();
      }
    } catch (error) {
      console.error('Failed to delete world:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete world. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">World Management</h2>
          {worldName && (
            <span className="text-sm text-muted-foreground">• {worldName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="overview">
                <Info className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="genealogy" disabled={settlements.length === 0 && countries.length === 0}>
                <Users className="w-4 h-4 mr-2" />
                Family Tree
              </TabsTrigger>
              <TabsTrigger value="map" disabled={settlements.length === 0 && countries.length === 0}>
                <Map className="w-4 h-4 mr-2" />
                Map
              </TabsTrigger>
              <TabsTrigger value="base-resources">
                <Settings className="w-4 h-4 mr-2" />
                Base Resources
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettingsDialog(true)}
                      className="gap-2"
                      disabled={!canEdit || loading}
                    >
                      <Lock className="w-4 h-4" />
                      Permissions
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canEdit && (
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      <span>Only the world owner can manage permissions</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="gap-2"
                      disabled={!canEdit || loading}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete World
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canEdit && (
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      <span>Only the world owner can delete this world</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeView === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>World Statistics</CardTitle>
                <CardDescription>Overview of your world's demographics and geography</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">Countries</span>
                    </div>
                    <p className="text-3xl font-bold">{countries.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Nation-states in this world
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Map className="w-4 h-4" />
                      <span className="text-sm">Settlements</span>
                    </div>
                    <p className="text-3xl font-bold">{settlements.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Cities, towns, and villages
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Total Population</span>
                    </div>
                    <p className="text-3xl font-bold">{totalPopulation.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      Characters across all settlements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {countries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Countries</CardTitle>
                  <CardDescription>Nations in this world</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {countries.map((country: any) => (
                      <div key={country.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{country.name}</h3>
                            <p className="text-sm text-muted-foreground">{country.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
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
                </CardContent>
              </Card>
            )}

            {settlements.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <Globe className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="font-semibold text-lg">No World Data Yet</h3>
                    <p className="text-muted-foreground">
                      Use the Procedural Generation tab to create countries, settlements, and characters for your world.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === 'genealogy' && (settlements.length > 0 || countries.length > 0) && (
          <GenealogyViewer worldId={worldId} countries={countries} settlements={settlements} />
        )}

        {activeView === 'map' && (settlements.length > 0 || countries.length > 0) && (
          <GeographyMap worldId={worldId} settlements={settlements} countries={countries} />
        )}

        {activeView === 'base-resources' && (
          <div className="max-w-4xl mx-auto">
            <BaseResourcesConfig worldId={worldId} />
          </div>
        )}

        {activeView === 'analytics' && (
          <PlaythroughAnalytics worldId={worldId} />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete World?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{worldName || 'this world'}</strong>?
              </p>
              <p className="text-destructive font-semibold">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All rules and grammars</li>
                <li>All simulations and their results</li>
                <li>All characters, countries, states, and settlements</li>
                <li>All actions, truths, and quests</li>
                <li>Everything associated with this world</li>
              </ul>
              <p className="font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorld}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete World'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* World Settings Dialog */}
      <WorldSettingsDialog
        worldId={worldId}
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        onSettingsUpdated={loadWorldData}
      />
    </div>
  );
}
