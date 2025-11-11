import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Zap, ArrowLeft, ChevronRight, Plus, Target, Clock, Battery, TrendingUp, Tag, Globe, Sword } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActionCreateDialog } from './ActionCreateDialog';
import { ActionEditDialog } from './ActionEditDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

interface HierarchicalActionsTabProps {
  worldId: string;
}

type ViewLevel = 'actions' | 'action-detail';

interface Action {
  id: string;
  worldId: string;
  name: string;
  description: string | null;
  actionType: string;
  category: string | null;
  duration: number | null;
  difficulty: number | null;
  energyCost: number | null;
  prerequisites: any[];
  effects: any[];
  sideEffects: any[];
  targetType: string | null;
  requiresTarget: boolean | null;
  range: number | null;
  isAvailable: boolean | null;
  cooldown: number | null;
  triggerConditions: any[];
  verbPast: string | null;
  verbPresent: string | null;
  narrativeTemplates: string[];
  sourceFormat: string | null;
  customData: Record<string, any>;
  tags: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function HierarchicalActionsTab({ worldId }: HierarchicalActionsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('actions');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  
  // Data state
  const [actions, setActions] = useState<Action[]>([]);
  const [baseActions, setBaseActions] = useState<Action[]>([]);
  const [enabledBaseActionIds, setEnabledBaseActionIds] = useState<string[]>([]);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [actionToEdit, setActionToEdit] = useState<Action | null>(null);

  // Load actions on mount
  useEffect(() => {
    if (worldId) fetchActions();
  }, [worldId]);

  // Fetch actions
  const fetchActions = async () => {
    try {
      // Fetch world-specific actions
      const actionsRes = await fetch(`/api/worlds/${worldId}/actions`);
      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        setActions(actionsData);
      }

      // Fetch base actions
      const baseActionsRes = await fetch('/api/actions/base');
      let baseActionsData: Action[] = [];
      if (baseActionsRes.ok) {
        baseActionsData = await baseActionsRes.json();
        setBaseActions(baseActionsData);
      }

      // Fetch world's base resource config
      const configRes = await fetch(`/api/worlds/${worldId}/base-resources/config`);
      if (configRes.ok) {
        const config = await configRes.json();
        // If no explicit config, all base actions are enabled by default
        const enabled = config.disabledBaseActions && config.disabledBaseActions.length > 0
          ? baseActionsData.filter((a: Action) => !config.disabledBaseActions.includes(a.id)).map((a: Action) => a.id)
          : baseActionsData.map((a: Action) => a.id);
        setEnabledBaseActionIds(enabled);
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  // Action creation mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/worlds/${worldId}/actions`, data);
      return await response.json();
    },
    onSuccess: () => {
      fetchActions();
      toast({
        title: "Action created",
        description: "The action was successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create action: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Navigation handlers
  const viewActionDetail = (action: Action) => {
    setSelectedAction(action);
    setViewLevel('action-detail');
  };

  const goBack = () => {
    if (viewLevel === 'action-detail') {
      setViewLevel('actions');
      setSelectedAction(null);
    }
  };

  // Get action type color
  const getActionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      social: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      physical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      mental: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      economic: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      magical: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
      political: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  // Breadcrumb rendering
  const renderBreadcrumb = () => {
    const parts: JSX.Element[] = [];
    
    if (viewLevel !== 'actions') {
      parts.push(
        <Button key="back" variant="ghost" size="sm" onClick={goBack} className="gap-1 hover:bg-primary/10">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      );
    }
    
    parts.push(
      <span key="world" className="text-sm text-muted-foreground font-medium">World</span>
    );
    
    if (selectedAction) {
      parts.push(<ChevronRight key="sep1" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        <span key="action" className="text-sm font-semibold text-primary">
          {selectedAction.name}
        </span>
      );
    }
    
    return (
      <div className="flex items-center gap-2 mb-6 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
        {parts}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-6">
      {renderBreadcrumb()}
      
      {/* Actions List View */}
      {viewLevel === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Actions
              </h2>
              <p className="text-muted-foreground mt-1">Click an action to view details and configuration</p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Action
            </Button>
          </div>
          
          <ScrollArea className="h-[600px]">
            <Tabs defaultValue="world" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="world">
                  <Sword className="w-4 h-4 mr-2" />
                  World Actions ({actions.length})
                </TabsTrigger>
                <TabsTrigger value="base">
                  <Globe className="w-4 h-4 mr-2" />
                  Base Actions ({baseActions.filter(a => enabledBaseActionIds.includes(a.id)).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="world" className="mt-0">
                <div className="grid gap-4">
                  {actions.length > 0 ? (
                    <div className="space-y-2">
                      {actions.map((action) => (
                        <Card 
                          key={action.id} 
                          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" 
                          onClick={() => viewActionDetail(action)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Zap className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CardTitle className="text-xl">{action.name}</CardTitle>
                                    <Badge className={getActionTypeColor(action.actionType)}>
                                      {action.actionType}
                                    </Badge>
                                  </div>
                                  <CardDescription className="mt-1">
                                    {action.description || 'No description provided'}
                                  </CardDescription>
                                </div>
                              </div>
                              <ChevronRight className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {action.category && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Category:</span>
                                  <span className="font-medium">{action.category}</span>
                                </div>
                              )}
                              {action.duration && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{action.duration} steps</span>
                                </div>
                              )}
                              {action.energyCost && (
                                <div className="flex items-center gap-2">
                                  <Battery className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{action.energyCost} energy</span>
                                </div>
                              )}
                              {action.difficulty !== null && (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{Math.round((action.difficulty || 0) * 100)}% difficulty</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="pt-12 pb-12">
                        <div className="text-center space-y-3">
                          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Zap className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-semibold">No World-Specific Actions</h3>
                          <p className="text-sm text-muted-foreground">
                            Click "Add Action" to create your first world-specific action
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="base" className="mt-0">
                <div className="grid gap-4">
                  {baseActions.filter(a => enabledBaseActionIds.includes(a.id)).length > 0 ? (
                    <div className="space-y-2">
                      {baseActions.filter(a => enabledBaseActionIds.includes(a.id)).map((action) => (
                        <Card 
                          key={action.id} 
                          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-pink-500" 
                          onClick={() => viewActionDetail(action)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                  <Zap className="w-5 h-5 text-pink-500" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CardTitle className="text-xl">{action.name}</CardTitle>
                                    <Badge variant="outline" className="bg-pink-500/10 text-pink-500">
                                      🌐 Base
                                    </Badge>
                                    <Badge className={getActionTypeColor(action.actionType)}>
                                      {action.actionType}
                                    </Badge>
                                  </div>
                                  <CardDescription className="mt-1">
                                    {action.description || 'Global action available across all worlds'}
                                  </CardDescription>
                                </div>
                              </div>
                              <ChevronRight className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </CardHeader>
                          {action.category && (
                            <CardContent>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Category:</span>
                                <span className="font-medium">{action.category}</span>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="pt-12 pb-12">
                        <div className="text-center space-y-3">
                          <div className="mx-auto w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center">
                            <Globe className="w-6 h-6 text-pink-500" />
                          </div>
                          <h3 className="font-semibold">No Base Actions Enabled</h3>
                          <p className="text-sm text-muted-foreground">
                            Enable base actions in the Base Resources Configuration
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>
      )}
      
      {/* Action Detail View */}
      {viewLevel === 'action-detail' && selectedAction && (
        <div className="space-y-6">
          {/* Action Info Card */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-2xl">{selectedAction.name}</CardTitle>
                      <Badge className={getActionTypeColor(selectedAction.actionType)}>
                        {selectedAction.actionType}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {selectedAction.description || 'No description provided'}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setActionToEdit(selectedAction);
                  setShowEditDialog(true);
                }}>
                  Edit Action
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <p className="font-semibold">{selectedAction.category || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <p className="font-semibold">{selectedAction.duration || 0} steps</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Energy Cost</span>
                  <p className="font-semibold">{selectedAction.energyCost || 0}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Difficulty</span>
                  <p className="font-semibold">{Math.round((selectedAction.difficulty || 0) * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Targeting & Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Targeting & Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Target Type</span>
                  <p className="font-semibold capitalize">{selectedAction.targetType || 'None'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Requires Target</span>
                  <p className="font-semibold">{selectedAction.requiresTarget ? 'Yes' : 'No'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Range</span>
                  <p className="font-semibold">{selectedAction.range === 0 ? 'Same location' : `${selectedAction.range} units`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Narrative */}
          {(selectedAction.verbPresent || selectedAction.verbPast) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Narrative
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {selectedAction.verbPresent && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Present Tense</span>
                      <p className="font-semibold">{selectedAction.verbPresent}</p>
                    </div>
                  )}
                  {selectedAction.verbPast && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Past Tense</span>
                      <p className="font-semibold">{selectedAction.verbPast}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Prerequisites */}
          {selectedAction.prerequisites && selectedAction.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prerequisites ({selectedAction.prerequisites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedAction.prerequisites.map((prereq, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <pre className="text-sm">{JSON.stringify(prereq, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Effects */}
          {selectedAction.effects && selectedAction.effects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Effects ({selectedAction.effects.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedAction.effects.map((effect, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <pre className="text-sm">{JSON.stringify(effect, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Tags */}
          {selectedAction.tags && selectedAction.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedAction.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Cooldown</span>
                  <p className="font-semibold">{selectedAction.cooldown || 0} steps</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <p className="font-semibold">{selectedAction.isAvailable ? 'Yes' : 'No'}</p>
                </div>
                {selectedAction.sourceFormat && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">System Type</span>
                    <p className="font-semibold">{selectedAction.sourceFormat}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Create Dialog */}
      <ActionCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(data) => {
          createActionMutation.mutate({ ...data, worldId });
          setShowCreateDialog(false);
        }}
      />
      
      {/* Edit Dialog */}
      {actionToEdit && (
        <ActionEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          action={actionToEdit}
          onActionUpdated={() => {
            fetchActions();
            if (selectedAction && actionToEdit?.id === selectedAction.id) {
              fetchActions().then(() => {
                const updated = actions.find(a => a.id === selectedAction.id);
                if (updated) setSelectedAction(updated);
              });
            }
            setShowEditDialog(false);
          }}
          onActionDeleted={() => {
            fetchActions();
            if (selectedAction && actionToEdit?.id === selectedAction.id) {
              goBack();
            }
            setShowEditDialog(false);
          }}
        />
      )}
    </div>
  );
}
