import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { WorldSelectionScreen } from '@/components/WorldSelectionScreen';
import { ModernNavbar } from '@/components/ModernNavbar';
import { HierarchicalRulesTab } from '@/components/HierarchicalRulesTab';
import { UnifiedWorldExplorerTab } from '@/components/UnifiedWorldExplorerTab';
import { HierarchicalActionsTab } from '@/components/HierarchicalActionsTab';
import { WorldManagementTab } from '@/components/WorldManagementTab';
import { TruthTab } from '@/components/TruthTab';
import { QuestsTab } from '@/components/QuestsTab';
import { PrologKnowledgeBase } from '@/components/PrologKnowledgeBase';
import { GrammarsTab } from '@/components/GrammarsTab';
import { ExportDialog } from '@/components/ExportDialog';
import { ImportDialog } from '@/components/ImportDialog';
import { SimulationCreateDialog } from '@/components/SimulationCreateDialog';
import { SimulationConfigDialog } from '@/components/SimulationConfigDialog';
import { SimulationTimelineView } from '@/components/SimulationTimelineView';
import { BabylonWorld } from '@/components/3DGame/BabylonWorld';
import { AuthDialog } from '@/components/AuthDialog';
import { PlaythroughsList } from '@/components/PlaythroughsList';
import { WorldBrowser } from '@/components/WorldBrowser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Play } from 'lucide-react';
import { InsimulRuleCompiler } from '@/lib/unified-syntax';
import type { InsertSimulation } from '@/../../shared/schema';

interface Character {
  id: string;
  firstName: string;
  lastName: string;
}

interface Simulation {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: any;
}

export default function ModernEditor() {
  const [selectedWorld, setSelectedWorld] = useState<string>('');
  const [activeTab, setActiveTab] = useState('home');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const ruleCompiler = new InsimulRuleCompiler();
  const { toast } = useToast();
  const { user, login, isAuthenticated } = useAuth();

  // Fetch characters for tabs that need them (TruthTab)
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['/api/worlds', selectedWorld, 'characters'],
    enabled: !!selectedWorld,
  });

  // Fetch rules for export
  const { data: rules = [] } = useQuery<any[]>({
    queryKey: ['/api/worlds', selectedWorld, 'rules'],
    enabled: !!selectedWorld,
  });

  // Fetch actions for export
  const { data: actions = [] } = useQuery<any[]>({
    queryKey: ['/api/worlds', selectedWorld, 'actions'],
    enabled: !!selectedWorld,
  });

  // Fetch worlds for world name
  const { data: worlds = [] } = useQuery<any[]>({
    queryKey: ['/api/worlds'],
  });

  // Fetch simulations for this world
  const { data: simulations = [] } = useQuery<Simulation[]>({
    queryKey: ['/api/worlds', selectedWorld, 'simulations'],
    enabled: !!selectedWorld && activeTab === 'simulations',
  });

  // Create simulation mutation
  const createSimulationMutation = useMutation({
    mutationFn: async (data: InsertSimulation) => {
      const response = await fetch(`/api/worlds/${selectedWorld}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create simulation');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'simulations'] });
      toast({ title: 'Simulation created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Run simulation mutation
  const runSimulationMutation = useMutation({
    mutationFn: async ({ simulationId, config }: { simulationId: string; config?: any }) => {
      const response = await fetch(`/api/simulations/${simulationId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config || {}),
      });
      if (!response.ok) throw new Error('Failed to run simulation');
      return response.json();
    },
    onSuccess: (data, variables) => {
      const speedText = variables.config?.executionSpeed === 'fast' ? 'quickly' :
        variables.config?.executionSpeed === 'detailed' ? 'with detailed analysis' : '';
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'simulations'] });
      toast({
        title: 'Simulation completed',
        description: `Simulation ran ${speedText}. Check the results below.`,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Simulation failed', description: error.message, variant: 'destructive' });
    },
  });

  // Handler for running simulation
  const handleRunSimulation = (simulationId: string, config?: any) => {
    runSimulationMutation.mutate({ simulationId, config });
  };

  // Show world selection if no world selected
  if (!selectedWorld) {
    return <WorldSelectionScreen onWorldSelected={setSelectedWorld} />;
  }

  const currentWorld = worlds.find(w => w.id === selectedWorld) || { id: selectedWorld, name: 'Selected World' };

  return (
    <div className="min-h-screen bg-background">
      <ModernNavbar
        currentWorld={currentWorld}
        activeTab={activeTab}
        onTabChange={(tab) => {
          // Handle special tabs
          if (tab === 'import') {
            setImportDialogOpen(true);
            return;
          }
          if (tab === 'export') {
            setExportDialogOpen(true);
            return;
          }
          // Require authentication for 3D game
          if (tab === '3d-game' && !isAuthenticated) {
            setAuthDialogOpen(true);
            toast({
              title: 'Authentication required',
              description: 'Please sign in to play the 3D game',
            });
            return;
          }
          setActiveTab(tab);
        }}
        onChangeWorld={() => setSelectedWorld('')}
        onOpenAuth={() => setAuthDialogOpen(true)}
      />

      <div className="container mx-auto p-6">
        {/* Rules Tab - Using HierarchicalRulesTab */}
        {activeTab === 'rules' && selectedWorld && (
          <HierarchicalRulesTab worldId={selectedWorld} />
        )}

        {/* Society Tab - Unified World Explorer */}
        {activeTab === 'society' && selectedWorld && (
          <UnifiedWorldExplorerTab worldId={selectedWorld} />
        )}

        {/* Actions Tab - Using HierarchicalActionsTab */}
        {activeTab === 'actions' && selectedWorld && (
          <HierarchicalActionsTab worldId={selectedWorld} />
        )}

        {/* Truth Tab */}
        {activeTab === 'truth' && selectedWorld && (
          <TruthTab worldId={selectedWorld} characters={characters} />
        )}

        {/* Prolog Knowledge Base Tab */}
        {activeTab === 'prolog' && selectedWorld && (
          <PrologKnowledgeBase worldId={selectedWorld} />
        )}

        {/* Quests Tab */}
        {activeTab === 'quests' && selectedWorld && (
          <QuestsTab worldId={selectedWorld} />
        )}

        {/* Grammars Tab */}
        {activeTab === 'grammars' && selectedWorld && (
          <GrammarsTab worldId={selectedWorld} />
        )}

        {/* Simulations Tab */}
        {activeTab === 'simulations' && selectedWorld && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Simulations ({simulations.length})
                  </CardTitle>
                  <CardDescription>
                    Run insimul simulations combining all systems with Tracery narrative generation
                  </CardDescription>
                </div>
                <SimulationCreateDialog
                  worldId={selectedWorld}
                  onCreateSimulation={(data) => createSimulationMutation.mutate(data)}
                  isLoading={createSimulationMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {simulations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No simulations yet. Create one to get started!
                  </div>
                ) : (
                  simulations.map((simulation) => (
                    <Card key={simulation.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{simulation.name}</div>
                          {simulation.description && (
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                              {simulation.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={
                                simulation.status === 'completed' ? 'default' :
                                simulation.status === 'running' ? 'secondary' : 'outline'
                              }
                            >
                              {simulation.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                        <SimulationConfigDialog
                          onRunSimulation={(config) => handleRunSimulation(simulation.id, config)}
                          isLoading={runSimulationMutation.isPending || simulation.status === 'running'}
                          worlds={worlds}
                        >
                          <Button
                            size="sm"
                            disabled={runSimulationMutation.isPending || simulation.status === 'running'}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Configure & Run
                          </Button>
                        </SimulationConfigDialog>
                      </div>

                      {simulation.results && (
                        <>
                          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded">
                            <div className="text-sm font-medium mb-2">Simulation Results:</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <strong>Execution Time:</strong><br />
                                {Math.round(simulation.results.executionTime)}ms
                              </div>
                              <div>
                                <strong>Rules Executed:</strong><br />
                                {simulation.results.rulesExecuted}
                              </div>
                              <div>
                                <strong>Events Generated:</strong><br />
                                {simulation.results.eventsGenerated}
                              </div>
                              <div>
                                <strong>Characters Affected:</strong><br />
                                {simulation.results.charactersAffected}
                              </div>
                            </div>
                            {simulation.results.narrative && (
                              <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded border">
                                <div className="text-sm font-medium mb-1">Generated Narrative:</div>
                                <p className="text-sm italic">{simulation.results.narrative}</p>
                              </div>
                            )}
                            {simulation.results.truthsCreated && simulation.results.truthsCreated.length > 0 && (
                              <div className="mt-3 text-sm text-muted-foreground">
                                ✅ Created {simulation.results.truthsCreated.length} timeline {simulation.results.truthsCreated.length === 1 ? 'event' : 'events'}
                              </div>
                            )}
                          </div>

                          {/* Timeline View */}
                          {simulation.results.truthsCreated && simulation.results.truthsCreated.length > 0 && (
                            <div className="mt-4">
                              <SimulationTimelineView
                                simulationId={simulation.id}
                                worldId={selectedWorld}
                                truthsCreated={simulation.results.truthsCreated}
                                ruleExecutionSequence={simulation.results.ruleExecutionSequence}
                                characterSnapshots={simulation.results.characterSnapshots ?
                                  new Map(Object.entries(simulation.results.characterSnapshots).map(([timestep, chars]) => [
                                    Number(timestep),
                                    new Map(Object.entries(chars as any))
                                  ])) :
                                  new Map()
                                }
                              />
                            </div>
                          )}
                        </>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3D Game Tab */}
        {activeTab === '3d-game' && selectedWorld && isAuthenticated && (
          <BabylonWorld
            worldId={selectedWorld}
            worldName={currentWorld?.name || 'Unknown World'}
            worldType={currentWorld?.config?.worldType}
            userId={user?.id}
            onBack={() => setActiveTab('simulations')}
          />
        )}

        {/* My Playthroughs Tab */}
        {activeTab === 'my-playthroughs' && (
          <PlaythroughsList
            onResumePlaythrough={(worldId, playthroughId) => {
              setSelectedWorld(worldId);
              setActiveTab('3d-game');
            }}
          />
        )}

        {/* Browse Worlds Tab */}
        {activeTab === 'browse-worlds' && (
          <WorldBrowser
            onPlayWorld={(worldId) => {
              setSelectedWorld(worldId);
              setActiveTab('3d-game');
            }}
          />
        )}

        {/* World Home Tab */}
        {activeTab === 'home' && selectedWorld && (
          <WorldManagementTab 
            worldId={selectedWorld} 
            worldName={currentWorld.name}
            onWorldDeleted={() => setSelectedWorld('')}
          />
        )}

        {/* Worlds Tab (legacy - redirect to home) */}
        {activeTab === 'worlds' && selectedWorld && (
          <WorldManagementTab 
            worldId={selectedWorld}
            worldName={currentWorld.name}
            onWorldDeleted={() => setSelectedWorld('')}
          />
        )}
      </div>

      {/* Export Dialog */}
      {selectedWorld && (
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          rules={rules.flatMap(file => {
            try {
              return ruleCompiler.compile(file.content, file.sourceFormat as any);
            } catch (error) {
              console.warn(`Failed to compile rules from ${file.name}:`, error);
              return [];
            }
          })}
          worldName={worlds.find(w => w.id === selectedWorld)?.name || 'world'}
          characters={characters}
          actions={actions}
          includeCharacters={true}
          includeActions={false}
        />
      )}

      {/* Import Dialog */}
      {selectedWorld && (
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          worldId={selectedWorld}
          onImportComplete={() => {
            // Refresh all data after import
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'characters'] });
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'actions'] });
          }}
        />
      )}

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthSuccess={(user, token) => {
          login(user, token);
          setActiveTab('3d-game');
        }}
      />
    </div>
  );
}
