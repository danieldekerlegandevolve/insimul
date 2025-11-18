import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useWorldPermissions } from '@/hooks/use-world-permissions';
import { Scroll, Plus, ArrowLeft, ChevronRight, Code, FileText, Edit, Save, X, RefreshCw, Globe, Lock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RuleCreateDialog } from './RuleCreateDialog';
import { RuleConvertDialog } from './RuleConvertDialog';

interface HierarchicalRulesTabProps {
  worldId: string;
}

type ViewLevel = 'list' | 'detail';

export function HierarchicalRulesTab({ worldId }: HierarchicalRulesTabProps) {
  const { toast } = useToast();
  const { canEdit, loading: permissionsLoading } = useWorldPermissions(worldId);

  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('list');
  const [selectedRule, setSelectedRule] = useState<any | null>(null);

  // Data states
  const [rules, setRules] = useState<any[]>([]);
  const [baseRules, setBaseRules] = useState<any[]>([]);
  const [enabledBaseRuleIds, setEnabledBaseRuleIds] = useState<string[]>([]);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (worldId) fetchRules();
  }, [worldId]);

  const fetchRules = async () => {
    try {
      // Fetch world-specific rules
      const rulesRes = await fetch(`/api/rules?worldId=${worldId}`);
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData);
      }

      // Fetch base rules
      const baseRulesRes = await fetch('/api/rules/base');
      let baseRulesData: any[] = [];
      if (baseRulesRes.ok) {
        baseRulesData = await baseRulesRes.json();
        setBaseRules(baseRulesData);
      }

      // Fetch world's base resource config
      const configRes = await fetch(`/api/worlds/${worldId}/base-resources/config`);
      if (configRes.ok) {
        const config = await configRes.json();
        // If no explicit config, all base rules are enabled by default
        const enabled = config.disabledBaseRules && config.disabledBaseRules.length > 0
          ? baseRulesData.filter((r: any) => !config.disabledBaseRules.includes(r.id)).map((r: any) => r.id)
          : baseRulesData.map((r: any) => r.id);
        setEnabledBaseRuleIds(enabled);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    }
  };

  const viewRuleDetail = (rule: any) => {
    setSelectedRule(rule);
    setViewLevel('detail');
  };

  const goBack = () => {
    setViewLevel('list');
    setSelectedRule(null);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const res = await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Rule Deleted', description: 'The rule has been removed' });
        fetchRules();
        if (selectedRule?.id === ruleId) {
          goBack();
        }
      } else {
        toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditedContent(selectedRule?.content || '');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const saveEdit = async () => {
    if (!selectedRule) return;
    
    try {
      const res = await fetch(`/api/rules/${selectedRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedContent
        })
      });
      
      if (res.ok) {
        toast({ title: 'Rule Updated', description: 'The rule has been saved' });
        setIsEditing(false);
        // Update the selected rule with new content
        setSelectedRule({ ...selectedRule, content: editedContent });
        fetchRules();
      } else {
        toast({ title: 'Error', description: 'Failed to save rule', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save rule', variant: 'destructive' });
    }
  };

  // Breadcrumb rendering
  const renderBreadcrumb = () => {
    if (viewLevel === 'list') return null;
    
    return (
      <div className="flex items-center gap-2 mb-6 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-1 hover:bg-primary/10">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <span className="text-sm text-muted-foreground font-medium">Rules</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-primary">{selectedRule?.name}</span>
      </div>
    );
  };

  const getRuleSyntaxBadge = (syntax: string) => {
    const colors: Record<string, string> = {
      insimul: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      talkofthetown: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      ensemble: 'bg-green-500/10 text-green-500 border-green-500/20',
      kismet: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    
    return (
      <Badge variant="outline" className={colors[syntax] || 'bg-gray-500/10 text-gray-500'}>
        {syntax}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 p-6">
      {renderBreadcrumb()}
      
      {/* Rules List View */}
      {viewLevel === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Rules
              </h2>
              <p className="text-muted-foreground mt-1">
                Define behavioral rules and logic for your simulation
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      disabled={!canEdit || permissionsLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canEdit && (
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      <span>Only the world owner can add rules</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <ScrollArea className="h-[600px]">
            <Tabs defaultValue="world" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="world">
                  <Scroll className="w-4 h-4 mr-2" />
                  World Rules ({rules.length})
                </TabsTrigger>
                <TabsTrigger value="base">
                  <Globe className="w-4 h-4 mr-2" />
                  Base Rules ({baseRules.filter(r => enabledBaseRuleIds.includes(r.id)).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="world" className="mt-0">
                <div className="grid gap-4">
                  {rules.map((rule) => (
                    <Card 
                      key={rule.id} 
                      className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-[1.01]" 
                      onClick={() => viewRuleDetail(rule)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Scroll className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-xl">{rule.name}</CardTitle>
                                {getRuleSyntaxBadge(rule.syntax)}
                                {!rule.isActive && (
                                  <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>{rule.description || 'No description'}</CardDescription>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {rule.priority !== undefined && (
                            <span>Priority: {rule.priority}</span>
                          )}
                          {rule.triggers && rule.triggers.length > 0 && (
                            <span>{rule.triggers.length} trigger(s)</span>
                          )}
                          {rule.tags && rule.tags.length > 0 && (
                            <span>{rule.tags.length} tag(s)</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {rules.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="pt-12 pb-12">
                        <div className="text-center space-y-3">
                          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Scroll className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-semibold">No World-Specific Rules</h3>
                          <p className="text-sm text-muted-foreground">
                            Click "Add Rule" to create your first world-specific rule
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="base" className="mt-0">
                <div className="grid gap-4">
                  {baseRules.filter(r => enabledBaseRuleIds.includes(r.id)).length > 0 ? (
                    <div className="space-y-2">
                      {baseRules.filter(r => enabledBaseRuleIds.includes(r.id)).map((rule) => (
                        <Card 
                          key={rule.id} 
                          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border-l-4 border-l-purple-500" 
                          onClick={() => viewRuleDetail(rule)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                  <Scroll className="w-5 h-5 text-purple-500" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CardTitle className="text-xl">{rule.name}</CardTitle>
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                                      🌐 Base
                                    </Badge>
                                    {getRuleSyntaxBadge(rule.syntax)}
                                  </div>
                                  <CardDescription>{rule.description || 'Global rule available across all worlds'}</CardDescription>
                                </div>
                              </div>
                              <ChevronRight className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </CardHeader>
                          {rule.category && (
                            <CardContent>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>Category: {rule.category}</span>
                                {rule.ruleType && <span>Type: {rule.ruleType}</span>}
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
                          <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-between">
                            <Globe className="w-6 h-6 text-purple-500" />
                          </div>
                          <h3 className="font-semibold">No Base Rules Enabled</h3>
                          <p className="text-sm text-muted-foreground">
                            Enable base rules in the Base Resources Configuration
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
      
      {/* Rule Detail View */}
      {viewLevel === 'detail' && selectedRule && (
        <div className="space-y-6">
          {/* Rule Info Card */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Scroll className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{selectedRule.name}</CardTitle>
                      {getRuleSyntaxBadge(selectedRule.syntax)}
                      {!selectedRule.isActive && (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{selectedRule.description || 'No description'}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <TooltipProvider>
                    {!isEditing ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={startEditing}
                                disabled={!canEdit || permissionsLoading}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!canEdit && (
                            <TooltipContent>
                              <div className="flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                <span>Only the world owner can edit rules</span>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowConvertDialog(true)}
                                disabled={!canEdit || permissionsLoading}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Convert
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!canEdit && (
                            <TooltipContent>
                              <div className="flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                <span>Only the world owner can convert rules</span>
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
                                onClick={() => handleDeleteRule(selectedRule.id)}
                                disabled={!canEdit || permissionsLoading}
                              >
                                Delete
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!canEdit && (
                            <TooltipContent>
                              <div className="flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                <span>Only the world owner can delete rules</span>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={saveEdit}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Syntax</span>
                  <p className="font-semibold">{selectedRule.syntax}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <p className="font-semibold">{selectedRule.priority || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <p className="font-semibold">{selectedRule.isActive ? '✓ Active' : 'Inactive'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">System</span>
                  <p className="font-semibold">{selectedRule.systemType || 'N/A'}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedRule.tags && selectedRule.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRule.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Code */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Rule Code
                  {isEditing && (
                    <span className="text-xs text-muted-foreground ml-2">(Editing)</span>
                  )}
                </h4>
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="h-[400px] font-mono text-sm"
                    placeholder="Enter rule code..."
                  />
                ) : (
                  <ScrollArea className="h-[400px]">
                    <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                      <code>{selectedRule.content || selectedRule.code || 'No code available'}</code>
                    </pre>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          {selectedRule.triggers && selectedRule.triggers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRule.triggers.map((trigger: string, i: number) => (
                    <li key={i} className="text-sm">{trigger}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {selectedRule.conditions && selectedRule.conditions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRule.conditions.map((condition: any, i: number) => (
                    <li key={i} className="text-sm">{JSON.stringify(condition)}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Create Dialog */}
      <RuleCreateDialog 
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) fetchRules(); // Refresh when dialog closes
        }}
        worldId={worldId}
        onCreateBlank={async (systemType) => {
          // Create blank rule
          try {
            const response = await fetch('/api/rules', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                worldId: worldId,
                name: `New ${systemType} Rule`,
                content: `// New ${systemType} rule\n// Add your rule content here`,
                systemType: systemType,
                ruleType: 'default',
                isActive: true
              })
            });
            
            if (response.ok) {
              console.log('Blank rule created successfully');
              setShowCreateDialog(false);
              fetchRules();
            } else {
              console.error('Failed to create blank rule:', await response.text());
            }
          } catch (error) {
            console.error('Error creating blank rule:', error);
          }
        }}
        onGenerateWithAI={async (prompt, systemType, bulkCreate) => {
          // Generate rule with AI
          setIsGenerating(true);
          try {
            toast({ 
              title: 'Generating...', 
              description: `Creating ${bulkCreate ? 'multiple rules' : 'rule'} with AI` 
            });
            
            // First, generate the rule content using AI
            const generateResponse = await fetch('/api/generate-rule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                systemType,
                bulkCreate
              })
            });
            
            if (!generateResponse.ok) {
              const errorText = await generateResponse.text();
              console.error('Failed to generate rule with AI:', errorText);
              toast({ 
                title: 'Generation Failed', 
                description: `Error: ${errorText}`,
                variant: 'destructive' 
              });
              setIsGenerating(false);
              return;
            }
            
            const responseData = await generateResponse.json();
            console.log('AI Response:', responseData);
            const { rule, isBulk } = responseData;
            
            // AI returns a string (the rule code), not an object
            // For single rule: rule is a string
            // For bulk: rule is a string with multiple rules separated by blank lines
            
            if (isBulk && typeof rule === 'string') {
              // Split bulk rules by double newlines or rule boundaries
              const ruleStrings = rule.split(/\n\n+/).filter(r => r.trim());
              let successCount = 0;
              
              for (let i = 0; i < ruleStrings.length; i++) {
                const ruleContent = ruleStrings[i].trim();
                if (!ruleContent) continue;
                
                // Try to extract rule name from the code
                const nameMatch = ruleContent.match(/rule\s+(\w+)/);
                const ruleName = nameMatch ? nameMatch[1] : `AI Rule ${i + 1}`;
                
                const createRes = await fetch('/api/rules', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    worldId: worldId,
                    name: ruleName,
                    content: ruleContent,
                    systemType: systemType,
                    ruleType: 'default',
                    isActive: true
                  })
                });
                if (createRes.ok) successCount++;
              }
              console.log(`${successCount}/${ruleStrings.length} AI rules created successfully`);
              toast({ 
                title: 'Rules Created', 
                description: `Successfully created ${successCount} AI-generated rules` 
              });
            } else {
              // Single rule - rule is just a string
              const ruleContent = typeof rule === 'string' ? rule : String(rule);
              
              // Try to extract rule name from the code
              const nameMatch = ruleContent.match(/rule\s+(\w+)/);
              const ruleName = nameMatch ? nameMatch[1] : `AI: ${prompt.substring(0, 30)}`;
              
              const createResponse = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  worldId: worldId,
                  name: ruleName,
                  content: ruleContent,
                  systemType: systemType,
                  ruleType: 'default',
                  isActive: true
                })
              });
              
              if (createResponse.ok) {
                console.log('AI rule created successfully');
                toast({ 
                  title: 'Rule Created', 
                  description: 'AI-generated rule saved successfully' 
                });
              } else {
                const errorText = await createResponse.text();
                console.error('Failed to save AI rule:', errorText);
                toast({ 
                  title: 'Save Failed', 
                  description: `Failed to save rule: ${errorText}`,
                  variant: 'destructive' 
                });
                setIsGenerating(false);
                return;
              }
            }
            
            setShowCreateDialog(false);
            fetchRules();
          } catch (error) {
            console.error('Error generating AI rule:', error);
            toast({ 
              title: 'Error', 
              description: `Failed to generate rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
              variant: 'destructive' 
            });
          } finally {
            setIsGenerating(false);
          }
        }}
        isGenerating={isGenerating}
      />

      {/* Rule Convert Dialog */}
      {selectedRule && (
        <RuleConvertDialog
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
          rule={{
            id: selectedRule.id,
            name: selectedRule.name,
            content: selectedRule.content,
            systemType: selectedRule.systemType || 'insimul'
          }}
          onConvert={async (ruleId, newContent, newSystemType) => {
            try {
              const res = await fetch(`/api/rules/${ruleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: newContent,
                  systemType: newSystemType
                })
              });
              
              if (res.ok) {
                toast({ 
                  title: 'Rule Converted', 
                  description: `Successfully converted to ${newSystemType} format` 
                });
                fetchRules();
                // Update selected rule
                setSelectedRule({
                  ...selectedRule,
                  content: newContent,
                  systemType: newSystemType
                });
              } else {
                toast({ 
                  title: 'Conversion Failed', 
                  description: 'Failed to save converted rule',
                  variant: 'destructive' 
                });
              }
            } catch (error) {
              toast({ 
                title: 'Error', 
                description: 'Failed to convert rule',
                variant: 'destructive' 
              });
            }
          }}
        />
      )}
    </div>
  );
}
