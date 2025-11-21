import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Globe, Trash2, ArrowRight, Plus, Sparkles, Database, Lock, Users, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { WorldCreateDialog } from "./WorldCreateDialog";
import { GenerationProgressDialog } from "./GenerationProgressDialog";
import { AdminPanel } from "./AdminPanel";
import type { InsertWorld } from "@shared/schema";

interface WorldSelectionScreenProps {
  onWorldSelected: (worldId: string) => void;
}

export function WorldSelectionScreen({ onWorldSelected }: WorldSelectionScreenProps) {
  const [worlds, setWorlds] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreatingWorld, setIsCreatingWorld] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [generationTaskId, setGenerationTaskId] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    fetchWorlds();
  }, [token]); // Refetch when auth state changes

  const fetchWorlds = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/worlds', { headers });
      if (res.ok) {
        const data = await res.json();
        setWorlds(data);
      }
    } catch (error) {
      console.error('Failed to fetch worlds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorld = async (
    data: InsertWorld,
    generateContent?: boolean,
    worldType?: string,
    customPrompt?: string,
    gameType?: string,
    customLabel?: string
  ) => {
    try {
      setIsCreatingWorld(true);

      // Enrich world config with high-level metadata so other views (e.g. 3D world) can style by theme
      const enrichedConfig = {
        ...(data.config || {}),
        ...(worldType ? { worldType } : {}),
        ...(gameType ? { gameType } : {}),
        ...(customLabel ? { worldTypeLabel: customLabel } : {})
      };
      data.config = enrichedConfig;

      // First, create the world
      const response = await apiRequest('POST', '/api/worlds', data);
      const newWorld = await response.json();

      setShowCreateDialog(false);
      setIsCreatingWorld(false);

      // If procedural generation is requested, trigger it with progress tracking
      if (generateContent) {
        const genResponse = await apiRequest('POST', '/api/generate/complete-world', {
          worldId: newWorld.id,
          worldType,
          customPrompt,
          customLabel,
          gameType,
          worldName: data.name,
          worldDescription: data.description,
        });
        
        const genResult = await genResponse.json();
        
        if (genResult.taskId) {
          // Show progress dialog and start polling
          setGenerationTaskId(genResult.taskId);
          setShowProgressDialog(true);
        } else {
          toast({
            title: "Error",
            description: "Failed to start generation tracking",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "World created",
          description: `${newWorld.name} has been created successfully.`,
        });
        await fetchWorlds();
      }
    } catch (error) {
      toast({
        title: "Error creating world",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setIsCreatingWorld(false);
    }
  };

  const handleGenerationComplete = async (success: boolean) => {
    setShowProgressDialog(false);
    setGenerationTaskId(null);
    
    if (success) {
      toast({
        title: "World Generated!",
        description: "Your world has been successfully generated.",
      });
    } else {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your world.",
        variant: "destructive",
      });
    }
    
    // Refresh worlds list
    await fetchWorlds();
  };

  // Compute total population for a world by traversing nested structures.
  // Strategy:
  // - If an object has explicit child collections (countries, states, settlements), sum those instead of using a possibly stale 'population' field on the parent.
  // - If no child collections are present but a numeric 'population' field exists, use it.
  // - Walk arrays and nested objects recursively when needed.
  const computePopulation = (node: any): number => {
    if (node == null) return 0;

    // If node is an array, sum each element.
    if (Array.isArray(node)) {
      return node.reduce((acc, item) => acc + computePopulation(item), 0);
    }

    // If node is an object, prefer summing known child collections when present.
    if (typeof node === 'object') {
      // Known collection keys to prefer when present.
      const childKeys = ['countries', 'states', 'settlements', 'regions', 'provinces', 'counties', 'cities', 'towns'];
      for (const key of childKeys) {
        if (Array.isArray(node[key]) && node[key].length > 0) {
          return computePopulation(node[key]);
        }
      }

      // If no child collections found, but there's an explicit numeric population, use it.
      if (typeof node.population === 'number') return node.population;

      // Otherwise, scan all properties and sum any arrays/objects found (fallback).
      return Object.values(node).reduce<number>((acc, val) => {
        if (Array.isArray(val) || (val && typeof val === 'object')) {
          return acc + computePopulation(val as any);
        }
        return acc;
      }, 0);
    }

    return 0;
  };

  // If admin panel is open, show it instead
  if (showAdminPanel) {
    return <AdminPanel onBack={() => setShowAdminPanel(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdminPanel(true)}
            className="absolute top-0 right-0"
          >
            <Database className="w-4 h-4 mr-2" />
            Admin Panel
          </Button>
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl mb-6 shadow-lg">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Welcome to Insimul
          </h1>
          <p className="text-xl text-muted-foreground">
            Select a world to begin, or create a new one
          </p>
        </div>

        {/* Worlds Grid */}
        <ScrollArea className="h-[500px] mb-8">
          {/* Your Worlds Section */}
          {worlds.filter(w => w.isOwner).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 px-2">Your Worlds</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {worlds.filter(w => w.isOwner).map((world) => {
                  const totalPop = computePopulation(world) || world.population || 0;
                  return (
                    <Card
                      key={world.id}
                      className="cursor-pointer hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                      onClick={() => onWorldSelected(world.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                              <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {world.name}
                              </CardTitle>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">Owner</Badge>
                                {world.visibility && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Eye className="w-3 h-3" />
                                    {world.visibility}
                                  </Badge>
                                )}
                                {world.requiresAuth && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Lock className="w-3 h-3" />
                                    Auth
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <CardDescription className="mt-2">{world.description || 'No description'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm">
                          {totalPop > 0 && (
                            <div>
                              <span className="text-muted-foreground">Pop:</span>{' '}
                              <span className="font-medium">{totalPop.toLocaleString()}</span>
                            </div>
                          )}
                          {world.playerCount !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Players:</span>{' '}
                              <span className="font-medium">{world.playerCount}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Worlds Section */}
          {worlds.filter(w => !w.isOwner).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 px-2">Other Worlds</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {worlds.filter(w => !w.isOwner).map((world) => {
                  const totalPop = computePopulation(world) || world.population || 0;
                  return (
                    <Card
                      key={world.id}
                      className="cursor-pointer hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                      onClick={() => onWorldSelected(world.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                              <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {world.name}
                              </CardTitle>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {world.visibility && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Eye className="w-3 h-3" />
                                    {world.visibility}
                                  </Badge>
                                )}
                                {world.requiresAuth && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Lock className="w-3 h-3" />
                                    Auth Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <CardDescription className="mt-2">{world.description || 'No description'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm">
                          {totalPop > 0 && (
                            <div>
                              <span className="text-muted-foreground">Pop:</span>{' '}
                              <span className="font-medium">{totalPop.toLocaleString()}</span>
                            </div>
                          )}
                          {world.playerCount !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Players:</span>{' '}
                              <span className="font-medium">{world.playerCount}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

            {/* Create New World Card - Only show when worlds exist */}
            {worlds.length > 0 && (
              <Card 
                className="cursor-pointer border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 group"
                onClick={() => setShowCreateDialog(true)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    Create New World
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start building your simulation
                  </p>
                </CardContent>
              </Card>
            )}

          {/* Empty State */}
          {!loading && worlds.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No Worlds Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first world to get started with Insimul
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First World
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Quick Stats */}
        {worlds.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            <p>You have {worlds.length} world{worlds.length !== 1 ? 's' : ''} ready to explore</p>
          </div>
        )}
      </div>

      {/* World Creation Dialog */}
      <WorldCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateWorld={handleCreateWorld}
        isLoading={isCreatingWorld}
      />

      {/* Generation Progress Dialog */}
      <GenerationProgressDialog
        open={showProgressDialog}
        taskId={generationTaskId}
        onComplete={handleGenerationComplete}
      />
    </div>
  );
}
