import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Sparkles, Zap, Target, Clock } from 'lucide-react';

interface ActionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (action: any, isBase: boolean) => void;
  onGenerateWithAI?: (prompt: string, bulkCreate: boolean, isBase: boolean) => void;
  isGenerating?: boolean;
  children?: React.ReactNode;
}

export function ActionCreateDialog({ open, onOpenChange, onSubmit, onGenerateWithAI, isGenerating = false, children }: ActionCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    actionType: 'social',
    category: '',
    duration: 1,
    difficulty: 0.5,
    energyCost: 1,
    targetType: 'none',
    requiresTarget: false,
    range: 0,
    cooldown: 0,
    verbPast: '',
    verbPresent: '',
    tags: '',
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [bulkCreate, setBulkCreate] = useState(false);
  const [isBaseResource, setIsBaseResource] = useState(false);
  const [category, setCategory] = useState('social');
  const [numActions, setNumActions] = useState(5);
  const [duration, setDuration] = useState(1);
  const [difficulty, setDifficulty] = useState(0.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const actionData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      prerequisites: [],
      effects: [],
      sideEffects: [],
      triggerConditions: [],
      narrativeTemplates: [],
    };

    onSubmit(actionData, isBaseResource);
    onOpenChange(false);

    // Reset form
    setIsBaseResource(false);
    setFormData({
      name: '',
      description: '',
      actionType: 'social',
      category: '',
      duration: 1,
      difficulty: 0.5,
      energyCost: 1,
      targetType: 'none',
      requiresTarget: false,
      range: 0,
      cooldown: 0,
      verbPast: '',
      verbPresent: '',
      tags: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Create New Action
          </DialogTitle>
          <DialogDescription>
            Choose how you want to create your action. Optionally mark it as a base resource for global availability.
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
            <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Action Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Negotiate Trade Deal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type *</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value) => setFormData({ ...formData, actionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="mental">Mental</SelectItem>
                  <SelectItem value="economic">Economic</SelectItem>
                  <SelectItem value="magical">Magical</SelectItem>
                  <SelectItem value="political">Political</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this action does..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., conversation, combat, trade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetType">Target Type</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) => setFormData({ ...formData, targetType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="other">Other Character</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (steps)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (0-1)</Label>
              <Input
                id="difficulty"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="energyCost">Energy Cost</Label>
              <Input
                id="energyCost"
                type="number"
                min="0"
                value={formData.energyCost}
                onChange={(e) => setFormData({ ...formData, energyCost: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="range">Range</Label>
              <Input
                id="range"
                type="number"
                min="0"
                value={formData.range}
                onChange={(e) => setFormData({ ...formData, range: parseInt(e.target.value) })}
                placeholder="0 = same location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cooldown">Cooldown (steps)</Label>
              <Input
                id="cooldown"
                type="number"
                min="0"
                value={formData.cooldown}
                onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="verbPresent">Verb (Present)</Label>
              <Input
                id="verbPresent"
                value={formData.verbPresent}
                onChange={(e) => setFormData({ ...formData, verbPresent: e.target.value })}
                placeholder="e.g., talks, fights"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verbPast">Verb (Past)</Label>
              <Input
                id="verbPast"
                value={formData.verbPast}
                onChange={(e) => setFormData({ ...formData, verbPast: e.target.value })}
                placeholder="e.g., talked, fought"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., diplomacy, trade, negotiation"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresTarget"
              checked={formData.requiresTarget}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requiresTarget: !!checked })
              }
            />
            <Label htmlFor="requiresTarget">Requires Target</Label>
          </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create {isBaseResource ? 'Base ' : ''}Action</Button>
              </DialogFooter>
            </form>
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

            {/* Action Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Action Description
                </CardTitle>
                <CardDescription>
                  Describe the type of actions you want characters to be able to perform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Create actions for characters to trade goods, negotiate prices, and complete business transactions..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="leisure">Leisure</SelectItem>
                      <SelectItem value="combat">Combat</SelectItem>
                      <SelectItem value="trade">Trade</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="magic">Magic</SelectItem>
                      <SelectItem value="crafting">Crafting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Action Parameters
                </CardTitle>
                <CardDescription>
                  Set default parameters for generated actions
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
                    <Label>Number of Actions: {numActions}</Label>
                    <Slider
                      value={[numActions]}
                      onValueChange={([v]) => setNumActions(v)}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration (time units): {duration}
                  </Label>
                  <Slider
                    value={[duration]}
                    onValueChange={([v]) => setDuration(v)}
                    min={0.5}
                    max={10}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty (0-1): {difficulty.toFixed(2)}</Label>
                  <Slider
                    value={[difficulty * 100]}
                    onValueChange={([v]) => setDifficulty(v / 100)}
                    min={0}
                    max={100}
                    step={5}
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
                    'Create social actions for characters to make friends, gossip, and form alliances',
                    'Generate work actions for different professions like blacksmith, merchant, farmer',
                    'Create leisure actions for entertainment, sports, and hobbies',
                    'Generate combat actions for different fighting styles and weapons',
                    'Create magic actions for casting spells and performing rituals'
                  ].map((example, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-2 px-3"
                      onClick={() => setAiPrompt(example)}
                    >
                      <Zap className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{example}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button 
              onClick={() => {
                if (onGenerateWithAI && aiPrompt.trim()) {
                  onGenerateWithAI(aiPrompt, bulkCreate, isBaseResource);
                  setAiPrompt('');
                  setIsBaseResource(false);
                }
              }}
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating {bulkCreate ? `${numActions} ${isBaseResource ? 'Base ' : ''}Actions` : `${isBaseResource ? 'Base ' : ''}Action`}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {bulkCreate ? `${numActions} ${isBaseResource ? 'Base ' : ''}Actions` : `${isBaseResource ? 'Base ' : ''}Action`}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
