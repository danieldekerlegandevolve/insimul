import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Loader2, Sparkles, Globe2, Map, Building2, Users, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProceduralGenerateTabProps {
  worldId: string;
}

export function ProceduralGenerateTab({ worldId }: ProceduralGenerateTabProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<'new' | 'extend'>('new');
  
  // Geography data
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedSettlement, setSelectedSettlement] = useState<string>('');

  // Generation config
  const [config, setConfig] = useState({
    // Countries
    numCountries: 1,
    countryPrefix: 'Kingdom',
    governmentType: 'monarchy' as 'monarchy' | 'republic' | 'democracy' | 'feudal' | 'theocracy' | 'empire',
    economicSystem: 'feudal' as 'feudal' | 'mercantile' | 'agricultural' | 'trade-based' | 'mixed',
    
    // States
    generateStates: true,
    numStatesPerCountry: 3,
    stateType: 'province' as 'province' | 'state' | 'territory' | 'region' | 'duchy' | 'county',
    
    // Settlements
    numCitiesPerState: 1,
    numTownsPerState: 2,
    numVillagesPerState: 3,
    terrain: 'plains' as 'plains' | 'hills' | 'mountains' | 'coast' | 'river' | 'forest' | 'desert',
    
    // Population (per settlement type)
    cityPopulation: 50000,
    townPopulation: 5000,
    villagePopulation: 500,
    
    // Genealogy
    foundedYear: 1850,
    numFoundingFamilies: 10,
    generations: 4,
    marriageRate: 0.7,
    fertilityRate: 0.6,
    deathRate: 0.3,
    
    // Generation flags
    generateGeography: true,
    generateGenealogy: true,
    generateBusinesses: true,
    
    // For extending existing locations
    addCities: 0,
    addTowns: 0,
    addVillages: 0,
    addPopulation: 0,
    addGenerations: 0
  });

  useEffect(() => {
    loadGeographyData();
  }, [worldId]);

  const loadGeographyData = async () => {
    try {
      const [countriesRes, settlementsRes] = await Promise.all([
        fetch(`/api/worlds/${worldId}/countries`),
        fetch(`/api/worlds/${worldId}/settlements`)
      ]);
      
      if (countriesRes.ok) {
        const countriesData = await countriesRes.json();
        setCountries(countriesData);
        if (countriesData.length > 0 && !selectedCountry) {
          setSelectedCountry(countriesData[0].id);
        }
      }
      
      if (settlementsRes.ok) {
        const settlementsData = await settlementsRes.json();
        setSettlements(settlementsData);
      }
    } catch (error) {
      console.error('Failed to load geography:', error);
    }
  };

  const loadStates = async (countryId: string) => {
    try {
      const response = await fetch(`/api/countries/${countryId}/states`);
      if (response.ok) {
        const data = await response.json();
        setStates(data);
      }
    } catch (error) {
      console.error('Failed to load states:', error);
    }
  };

  useEffect(() => {
    if (selectedCountry) {
      loadStates(selectedCountry);
    }
  }, [selectedCountry]);

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/hierarchical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId,
          ...config
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const result = await response.json();
      
      toast({
        title: "World Generated!",
        description: `Created ${result.numCountries} countries, ${result.numStates} states, ${result.numSettlements} settlements with ${result.totalPopulation} characters.`
      });
      
      await loadGeographyData();
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

  const handleExtendExisting = async () => {
    if (!selectedCountry && !selectedState && !selectedSettlement) {
      toast({
        title: "No Location Selected",
        description: "Please select a country, state, or settlement to extend",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId,
          countryId: selectedCountry,
          stateId: selectedState,
          settlementId: selectedSettlement,
          ...config
        })
      });

      if (!response.ok) throw new Error('Extension failed');

      const result = await response.json();
      
      toast({
        title: "Location Extended!",
        description: `Added ${result.newSettlements || 0} settlements and ${result.newCharacters || 0} characters.`
      });
      
      await loadGeographyData();
    } catch (error) {
      toast({
        title: "Extension Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Procedural Generation</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Generation Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Generation Mode</CardTitle>
                <CardDescription>Choose whether to generate new content or extend existing locations</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New
                    </TabsTrigger>
                    <TabsTrigger value="extend" disabled={countries.length === 0}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Extend Existing
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {generationMode === 'extend' && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Location to Extend</CardTitle>
                  <CardDescription>Choose a country, state, or settlement to add more content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {states.length > 0 && (
                    <div className="space-y-2">
                      <Label>State (Optional)</Label>
                      <div className="flex gap-2">
                        <Select value={selectedState} onValueChange={setSelectedState}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map(state => (
                              <SelectItem key={state.id} value={state.id}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedState && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedState('')}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Add Cities: {config.addCities}</Label>
                    <Slider
                      value={[config.addCities]}
                      onValueChange={([v]) => setConfig({ ...config, addCities: v })}
                      min={0}
                      max={5}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add Towns: {config.addTowns}</Label>
                    <Slider
                      value={[config.addTowns]}
                      onValueChange={([v]) => setConfig({ ...config, addTowns: v })}
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add Villages: {config.addVillages}</Label>
                    <Slider
                      value={[config.addVillages]}
                      onValueChange={([v]) => setConfig({ ...config, addVillages: v })}
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add Generations: {config.addGenerations}</Label>
                    <Slider
                      value={[config.addGenerations]}
                      onValueChange={([v]) => setConfig({ ...config, addGenerations: v })}
                      min={0}
                      max={5}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {generationMode === 'new' && (
              <>
                {/* Country Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe2 className="w-5 h-5 text-primary" />
                      Country Generation
                    </CardTitle>
                    <CardDescription>Configure how many countries to generate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Number of Countries: {config.numCountries}</Label>
                      <Slider
                        value={[config.numCountries]}
                        onValueChange={([v]) => setConfig({ ...config, numCountries: v })}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Government Type</Label>
                        <Select
                          value={config.governmentType}
                          onValueChange={(v: any) => setConfig({ ...config, governmentType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monarchy">Monarchy</SelectItem>
                            <SelectItem value="republic">Republic</SelectItem>
                            <SelectItem value="democracy">Democracy</SelectItem>
                            <SelectItem value="feudal">Feudal</SelectItem>
                            <SelectItem value="theocracy">Theocracy</SelectItem>
                            <SelectItem value="empire">Empire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Economic System</Label>
                        <Select
                          value={config.economicSystem}
                          onValueChange={(v: any) => setConfig({ ...config, economicSystem: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="feudal">Feudal</SelectItem>
                            <SelectItem value="mercantile">Mercantile</SelectItem>
                            <SelectItem value="agricultural">Agricultural</SelectItem>
                            <SelectItem value="trade-based">Trade-Based</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* State Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-primary" />
                      State/Province Generation
                    </CardTitle>
                    <CardDescription>Configure state generation within each country</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Generate States</Label>
                      <Switch
                        checked={config.generateStates}
                        onCheckedChange={(checked) => setConfig({ ...config, generateStates: checked })}
                      />
                    </div>

                    {config.generateStates && (
                      <>
                        <div className="space-y-2">
                          <Label>States per Country: {config.numStatesPerCountry}</Label>
                          <Slider
                            value={[config.numStatesPerCountry]}
                            onValueChange={([v]) => setConfig({ ...config, numStatesPerCountry: v })}
                            min={1}
                            max={10}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>State Type</Label>
                          <Select
                            value={config.stateType}
                            onValueChange={(v: any) => setConfig({ ...config, stateType: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="province">Province</SelectItem>
                              <SelectItem value="state">State</SelectItem>
                              <SelectItem value="territory">Territory</SelectItem>
                              <SelectItem value="region">Region</SelectItem>
                              <SelectItem value="duchy">Duchy</SelectItem>
                              <SelectItem value="county">County</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Settlement Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Settlement Generation
                    </CardTitle>
                    <CardDescription>Configure cities, towns, and villages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cities per {config.generateStates ? 'State' : 'Country'}: {config.numCitiesPerState}</Label>
                        <Slider
                          value={[config.numCitiesPerState]}
                          onValueChange={([v]) => setConfig({ ...config, numCitiesPerState: v })}
                          min={0}
                          max={5}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Towns per {config.generateStates ? 'State' : 'Country'}: {config.numTownsPerState}</Label>
                        <Slider
                          value={[config.numTownsPerState]}
                          onValueChange={([v]) => setConfig({ ...config, numTownsPerState: v })}
                          min={0}
                          max={10}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Villages per {config.generateStates ? 'State' : 'Country'}: {config.numVillagesPerState}</Label>
                        <Slider
                          value={[config.numVillagesPerState]}
                          onValueChange={([v]) => setConfig({ ...config, numVillagesPerState: v })}
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Terrain Type</Label>
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
                  </CardContent>
                </Card>

                {/* Population Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Population Settings
                    </CardTitle>
                    <CardDescription>Configure genealogy and population generation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Founded Year</Label>
                        <Input
                          type="number"
                          value={config.foundedYear}
                          onChange={(e) => setConfig({ ...config, foundedYear: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Founding Families per Settlement: {config.numFoundingFamilies}</Label>
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

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Label>Generate Geography</Label>
                      <Switch
                        checked={config.generateGeography}
                        onCheckedChange={(checked) => setConfig({ ...config, generateGeography: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Generate Genealogy</Label>
                      <Switch
                        checked={config.generateGenealogy}
                        onCheckedChange={(checked) => setConfig({ ...config, generateGenealogy: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Generate Businesses</Label>
                      <Switch
                        checked={config.generateBusinesses}
                        onCheckedChange={(checked) => setConfig({ ...config, generateBusinesses: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Button
              onClick={generationMode === 'new' ? handleGenerateNew : handleExtendExisting}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generationMode === 'new' ? 'Generate World' : 'Extend Location'}
                </>
              )}
            </Button>
        </div>
      </div>
    </div>
  );
}
