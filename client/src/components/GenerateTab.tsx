import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Sparkles, Users, Map, TreePine, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GenealogyViewer } from './visualization/GenealogyViewer';
import { GeographyMap } from './visualization/GeographyMap';

interface GenerateTabProps {
  worldId?: string;
}

export function GenerateTab({ worldId }: GenerateTabProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorldId, setGeneratedWorldId] = useState<string | null>(worldId || null);
  const [activeView, setActiveView] = useState<'config' | 'genealogy' | 'map'>('config');
  
  // Generation config
  const [config, setConfig] = useState({
    worldName: 'New World',
    settlementName: 'New Settlement',
    settlementType: 'town' as 'village' | 'town' | 'city',
    terrain: 'plains' as 'plains' | 'hills' | 'mountains' | 'coast' | 'river' | 'forest' | 'desert',
    foundedYear: 1850,
    numFoundingFamilies: 10,
    generations: 4,
    marriageRate: 0.7,
    fertilityRate: 0.6,
    deathRate: 0.3,
    generateGeography: true,
    generateGenealogy: true
  });

  const handleGenerateWorld = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Generation failed');

      const result = await response.json();
      setGeneratedWorldId(result.worldId);
      
      toast({
        title: "World Generated!",
        description: `Created ${result.population} characters across ${result.generations} generations in ${result.districts} districts.`
      });
      
      setActiveView('genealogy');
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadPreset = async (presetName: string) => {
    try {
      const response = await fetch('/api/generate/presets');
      const presets = await response.json();
      const preset = presets[presetName];
      
      if (preset) {
        setConfig({ ...config, ...preset });
        toast({
          title: "Preset Loaded",
          description: `Loaded ${presetName} configuration`
        });
      }
    } catch (error) {
      toast({
        title: "Failed to load preset",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Procedural Generation</h2>
        </div>
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="genealogy" disabled={!generatedWorldId}>
              <Users className="w-4 h-4 mr-2" />
              Genealogy
            </TabsTrigger>
            <TabsTrigger value="map" disabled={!generatedWorldId}>
              <Map className="w-4 h-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeView === 'config' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Presets</CardTitle>
                <CardDescription>Start with a predefined configuration</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => handleLoadPreset('medievalVillage')}>
                  <TreePine className="w-4 h-4 mr-2" />
                  Medieval Village
                </Button>
                <Button variant="outline" onClick={() => handleLoadPreset('colonialTown')}>
                  Colonial Town
                </Button>
                <Button variant="outline" onClick={() => handleLoadPreset('modernCity')}>
                  Modern City
                </Button>
                <Button variant="outline" onClick={() => handleLoadPreset('fantasyRealm')}>
                  Fantasy Realm
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>World Settings</CardTitle>
                <CardDescription>Configure your world's basic properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="worldName">World Name</Label>
                    <Input
                      id="worldName"
                      value={config.worldName}
                      onChange={(e) => setConfig({ ...config, worldName: e.target.value })}
                      placeholder="e.g., Medieval Realm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settlementName">Settlement Name</Label>
                    <Input
                      id="settlementName"
                      value={config.settlementName}
                      onChange={(e) => setConfig({ ...config, settlementName: e.target.value })}
                      placeholder="e.g., Thornbrook"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settlementType">Settlement Type</Label>
                  <Select
                    value={config.settlementType}
                    onValueChange={(v: any) => setConfig({ ...config, settlementType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="village">Village (500)</SelectItem>
                      <SelectItem value="town">Town (5,000)</SelectItem>
                      <SelectItem value="city">City (50,000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="terrain">Terrain</Label>
                    <Select
                      value={config.terrain}
                      onValueChange={(v: any) => setConfig({ ...config, terrain: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plains">Plains</SelectItem>
                        <SelectItem value="hills">Hills</SelectItem>
                        <SelectItem value="mountains">Mountains</SelectItem>
                        <SelectItem value="coast">Coast</SelectItem>
                        <SelectItem value="river">River</SelectItem>
                        <SelectItem value="forest">Forest</SelectItem>
                        <SelectItem value="desert">Desert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time Period</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Founded Year"
                        value={config.foundedYear}
                        onChange={(e) => setConfig({ ...config, foundedYear: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Population Settings</CardTitle>
                <CardDescription>Configure genealogy generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Founding Families: {config.numFoundingFamilies}</Label>
                  <Slider
                    value={[config.numFoundingFamilies]}
                    onValueChange={([v]) => setConfig({ ...config, numFoundingFamilies: v })}
                    min={2}
                    max={30}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Generations: {config.generations}</Label>
                  <Slider
                    value={[config.generations]}
                    onValueChange={([v]) => setConfig({ ...config, generations: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Marriage Rate: {(config.marriageRate * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[config.marriageRate * 100]}
                      onValueChange={([v]) => setConfig({ ...config, marriageRate: v / 100 })}
                      min={20}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fertility Rate: {(config.fertilityRate * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[config.fertilityRate * 100]}
                      onValueChange={([v]) => setConfig({ ...config, fertilityRate: v / 100 })}
                      min={20}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Death Rate: {(config.deathRate * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[config.deathRate * 100]}
                      onValueChange={([v]) => setConfig({ ...config, deathRate: v / 100 })}
                      min={10}
                      max={80}
                      step={5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerateWorld}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating World...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate World
                </>
              )}
            </Button>
          </div>
        )}

        {activeView === 'genealogy' && generatedWorldId && (
          <GenealogyViewer worldId={generatedWorldId} />
        )}

        {activeView === 'map' && generatedWorldId && (
          <GeographyMap worldId={generatedWorldId} />
        )}
      </div>
    </div>
  );
}
