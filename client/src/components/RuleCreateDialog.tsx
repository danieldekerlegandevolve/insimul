import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Sparkles, Plus, Lightbulb, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RuleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onCreateBlank: (sourceFormat: string, isBase: boolean) => void;
  onGenerateWithAI: (prompt: string, sourceFormat: string, bulkCreate: boolean, isBase: boolean) => void;
  isGenerating?: boolean;
}

export function RuleCreateDialog({
  open,
  onOpenChange,
  worldId,
  onCreateBlank,
  onGenerateWithAI,
  isGenerating = false
}: RuleCreateDialogProps) {
  const [sourceFormat, setSystemType] = useState('insimul');
  const [aiPrompt, setAiPrompt] = useState('');
  const [bulkCreate, setBulkCreate] = useState(false);
  const [isBaseResource, setIsBaseResource] = useState(false);
  const [numRules, setNumRules] = useState(5);
  const [ruleType, setRuleType] = useState<'trigger' | 'volition' | 'genealogy' | 'trait'>('trigger');
  const [priority, setPriority] = useState(5);
  const [tags, setTags] = useState('');
  const { toast } = useToast();

  const handleCreateBlank = () => {
    onCreateBlank(sourceFormat, isBaseResource);
    onOpenChange(false);
    setAiPrompt('');
    setIsBaseResource(false);
  };

  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description for the AI to generate rules',
        variant: 'destructive'
      });
      return;
    }

    // Enhance prompt with bulk generation parameters
    let enhancedPrompt = aiPrompt;
    if (bulkCreate) {
      enhancedPrompt = `${aiPrompt}. Generate ${numRules} ${ruleType} rules. Priority: ${priority}. Tags: ${tags || 'none'}`;
    }

    onGenerateWithAI(enhancedPrompt, sourceFormat, bulkCreate, isBaseResource);
    // Don't close dialog yet - wait for generation to complete
    setAiPrompt('');
    setIsBaseResource(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Rule
          </DialogTitle>
          <DialogDescription>
            Choose how you want to create your rule. Optionally mark it as a base resource for global availability.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <Plus className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            {/* Base Resource Checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <input
                id="is-base-resource-manual"
                type="checkbox"
                checked={isBaseResource}
                onChange={(e) => setIsBaseResource(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <Label htmlFor="is-base-resource-manual" className="cursor-pointer text-sm">
                <strong>Create as Base Resource</strong> (global, available to all worlds)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blank-system-type">System Type</Label>
              <Select value={sourceFormat} onValueChange={setSystemType}>
                <SelectTrigger id="blank-system-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insimul">Insimul</SelectItem>
                  <SelectItem value="ensemble">Ensemble</SelectItem>
                  <SelectItem value="kismet">Kismet</SelectItem>
                  <SelectItem value="tott">Talk of the Town</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium mb-2">What you'll get:</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• A new rule file with example template</li>
                <li>• Pre-filled with {sourceFormat} syntax structure</li>
                <li>• Ready to customize for your specific needs</li>
              </ul>
            </div>

            <Button onClick={handleCreateBlank} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create {isBaseResource ? 'Base' : ''} Rule
            </Button>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            {/* Base Resource Checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <input
                id="is-base-resource-ai"
                type="checkbox"
                checked={isBaseResource}
                onChange={(e) => setIsBaseResource(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <Label htmlFor="is-base-resource-ai" className="cursor-pointer text-sm">
                <strong>Create as Base Resource</strong> (global, available to all worlds)
              </Label>
            </div>

            {/* AI Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Rule Description
                </CardTitle>
                <CardDescription>
                  Describe the rules you want to generate. Be specific about the domain and behavior.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Create rules for noble succession and inheritance in a medieval kingdom..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>System Type</Label>
                    <Select value={sourceFormat} onValueChange={setSystemType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insimul">Insimul</SelectItem>
                        <SelectItem value="ensemble">Ensemble JSON</SelectItem>
                        <SelectItem value="kismet">Kismet Prolog</SelectItem>
                        <SelectItem value="tott">Talk of the Town JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select value={ruleType} onValueChange={(value: any) => setRuleType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trigger">Trigger</SelectItem>
                        <SelectItem value="volition">Volition</SelectItem>
                        <SelectItem value="genealogy">Genealogy</SelectItem>
                        <SelectItem value="trait">Trait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-primary" />
                  Generation Settings
                </CardTitle>
                <CardDescription>
                  Configure how many rules to generate and their properties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Bulk Generation</Label>
                  <Switch
                    checked={bulkCreate}
                    onCheckedChange={setBulkCreate}
                  />
                </div>

                {bulkCreate && (
                  <div className="space-y-2">
                    <Label>Number of Rules: {numRules}</Label>
                    <Slider
                      value={[numRules]}
                      onValueChange={([v]) => setNumRules(v)}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Priority: {priority}</Label>
                  <Slider
                    value={[priority]}
                    onValueChange={([v]) => setPriority(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., nobility, inheritance, succession"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Example Prompts */}
            <Card>
              <CardHeader>
                <CardTitle>Example Prompts</CardTitle>
                <CardDescription>Click to use these example prompts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    'Create rules for noble succession where the eldest child inherits titles and lands',
                    'Generate social interaction rules for characters meeting at different locations',
                    'Create genealogy rules for tracking family relationships across generations',
                    'Generate volition rules for characters deciding whether to get married',
                    'Create trait rules for personality development based on life experiences'
                  ].map((example, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-2 px-3"
                      onClick={() => setAiPrompt(example)}
                    >
                      <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{example}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateAI} 
              className="w-full"
              size="lg"
              disabled={isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating {bulkCreate ? `${numRules} ${isBaseResource ? 'Base ' : ''}Rules` : `${isBaseResource ? 'Base ' : ''}Rule`}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {bulkCreate ? `${numRules} ${isBaseResource ? 'Base ' : ''}Rules` : `${isBaseResource ? 'Base ' : ''}Rule`}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
