import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Play, Clock, Target, Zap, Globe } from "lucide-react";

interface SimulationConfigDialogProps {
  onRunSimulation: (config: any) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
  worlds?: any[];
}

export function SimulationConfigDialog({ onRunSimulation, isLoading = false, children, worlds = [] }: SimulationConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<{
    maxRules: number;
    maxEvents: number;
    maxCharacters: number;
    timeRange: { start: number; end: number; step: number };
    contentFocus: string;
    executionSpeed: string;
    worldId: string | null;
  }>({
    maxRules: 8,
    maxEvents: 5,
    maxCharacters: 4,
    timeRange: { start: 0, end: 100, step: 1 },
    contentFocus: 'all',
    executionSpeed: 'normal',
    worldId: null
  });

  const contentFocusOptions = [
    { id: 'all', label: 'All Content', description: 'Include all types of events and rules' },
    { id: 'politics', label: 'Politics', description: 'Focus on noble succession, diplomacy, court intrigue' },
    { id: 'romance', label: 'Romance', description: 'Emphasize relationships and marriage alliances' },
    { id: 'conflict', label: 'Conflict', description: 'Prioritize wars, rivalries, and disputes' },
    { id: 'trade', label: 'Trade', description: 'Highlight economic and merchant activities' },
    { id: 'magic', label: 'Magic', description: 'Focus on prophecies and supernatural events' }
  ];

  const executionSpeedOptions = [
    { id: 'fast', label: 'Fast', description: 'Quick execution, less detailed output' },
    { id: 'normal', label: 'Normal', description: 'Balanced speed and detail' },
    { id: 'detailed', label: 'Detailed', description: 'Slower but more comprehensive results' }
  ];

  const handleRunClick = () => {
    onRunSimulation(config);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" disabled={isLoading}>
            <Play className="w-4 h-4 mr-2" />
            Configure & Run
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Simulation Configuration
          </DialogTitle>
          <DialogDescription>
            Customize your simulation parameters to control the execution behavior and content focus.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="scope" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
          </TabsList>

          <TabsContent value="scope" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Simulation Scope
                </CardTitle>
                <CardDescription>
                  Control the scale and intensity of the simulation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Maximum Rules to Execute: {config.maxRules}</Label>
                  <Slider
                    value={[config.maxRules]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, maxRules: value }))}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">Higher values create more complex simulations</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Events to Generate: {config.maxEvents}</Label>
                  <Slider
                    value={[config.maxEvents]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, maxEvents: value }))}
                    max={15}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">More events create richer narratives</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Characters to Affect: {config.maxCharacters}</Label>
                  <Slider
                    value={[config.maxCharacters]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, maxCharacters: value }))}
                    max={12}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">Larger scope affects more of your cast</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Content Focus
                </CardTitle>
                <CardDescription>
                  Choose what types of events and rules to prioritize.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={config.contentFocus} onValueChange={(value) => setConfig(prev => ({ ...prev, contentFocus: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentFocusOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-slate-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {worlds.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>World Context</Label>
                    <Select value={config.worldId || 'none'} onValueChange={(value) => setConfig(prev => ({ ...prev, worldId: value === 'none' ? null : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a world (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific world</SelectItem>
                        {worlds.map((world: any) => (
                          <SelectItem key={world.id} value={world.id}>
                            {world.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="execution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Execution Settings
                </CardTitle>
                <CardDescription>
                  Configure how the simulation runs and processes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Execution Speed</Label>
                  <Select value={config.executionSpeed} onValueChange={(value) => setConfig(prev => ({ ...prev, executionSpeed: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {executionSpeedOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-slate-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="number"
                      value={config.timeRange.start}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        timeRange: { ...prev.timeRange, start: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="number"
                      value={config.timeRange.end}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        timeRange: { ...prev.timeRange, end: parseInt(e.target.value) || 100 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Step</Label>
                    <Input
                      type="number"
                      value={config.timeRange.step}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        timeRange: { ...prev.timeRange, step: parseInt(e.target.value) || 1 }
                      }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Time range defines the simulation period. Step controls granularity.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRunClick} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Simulation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}