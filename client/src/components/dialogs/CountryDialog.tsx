import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Sparkles, Globe2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CountryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onSuccess: () => void;
}

export function CountryDialog({ open, onOpenChange, worldId, onSuccess }: CountryDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', description: '', governmentType: '', economicSystem: '', foundedYear: new Date().getFullYear()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Procedural generation config
  const [numSettlements, setNumSettlements] = useState(3);
  const [numFoundingFamilies, setNumFoundingFamilies] = useState(10);
  const [generations, setGenerations] = useState(4);
  const [generateBusinesses, setGenerateBusinesses] = useState(true);

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast({ title: 'Country Created', description: `${form.name} has been created` });
        setForm({ name: '', description: '', governmentType: '', economicSystem: '', foundedYear: new Date().getFullYear() });
        onSuccess();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast({ title: 'Error', description: errorData.error || errorData.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create country', variant: 'destructive' });
    }
  };

  const handleProceduralGenerate = async () => {
    setIsGenerating(true);
    try {
      // Use the world generation API endpoint
      const res = await fetch(`/api/worlds/${worldId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldName: form.name || 'Generated Kingdom',
          settlementName: aiPrompt || 'Capital',
          numCountries: 1,
          numStatesPerCountry: 0,
          numCitiesPerState: numSettlements,
          numTownsPerState: 0,
          numVillagesPerState: 0,
          terrain: 'plains',
          cityPopulation: 5000,
          foundedYear: form.foundedYear,
          numFoundingFamilies,
          generations,
          marriageRate: 0.7,
          fertilityRate: 0.6,
          deathRate: 0.3,
          generateGeography: true,
          generateGenealogy: true,
          generateBusinesses,
          governmentType: form.governmentType || 'monarchy',
          economicSystem: form.economicSystem || 'feudal'
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        toast({ 
          title: 'Society Generated!', 
          description: `Created country with ${result.numSettlements} settlements and ${result.totalPopulation} characters` 
        });
        setForm({ name: '', description: '', governmentType: '', economicSystem: '', foundedYear: new Date().getFullYear() });
        setAiPrompt('');
        onSuccess();
        onOpenChange(false);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast({ title: 'Error', description: errorData.error || errorData.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe2 className="w-5 h-5" />
            Create Country
          </DialogTitle>
          <DialogDescription>Choose how you want to create your country</DialogDescription>
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
            <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kingdom of Valoria" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A feudal kingdom..." />
          </div>
          <div className="space-y-2">
            <Label>Founded Year</Label>
            <Input type="number" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: parseInt(e.target.value) || new Date().getFullYear() })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Government</Label>
              <Select value={form.governmentType} onValueChange={(v) => setForm({ ...form, governmentType: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
              <Label>Economy</Label>
              <Select value={form.economicSystem} onValueChange={(v) => setForm({ ...form, economicSystem: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.name}>Create</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Country Name *</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="Kingdom of Valoria" 
                />
              </div>

              <div className="space-y-2">
                <Label>Capital/Settlement Description</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the main settlement (e.g., 'A bustling port city on the coast' or 'A fortified mountain stronghold')"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Government</Label>
                  <Select value={form.governmentType} onValueChange={(v) => setForm({ ...form, governmentType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                  <Label>Economy</Label>
                  <Select value={form.economicSystem} onValueChange={(v) => setForm({ ...form, economicSystem: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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

              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 space-y-4">
                <h4 className="text-sm font-semibold">Procedural Generation Options</h4>
                
                <div className="space-y-2">
                  <Label>Number of Settlements: {numSettlements}</Label>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[numSettlements]}
                    onValueChange={(value) => setNumSettlements(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Founding Families: {numFoundingFamilies}</Label>
                  <Slider
                    min={1}
                    max={30}
                    step={1}
                    value={[numFoundingFamilies]}
                    onValueChange={(value) => setNumFoundingFamilies(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Generations: {generations}</Label>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[generations]}
                    onValueChange={(value) => setGenerations(value[0])}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generate-businesses"
                    checked={generateBusinesses}
                    onCheckedChange={(checked) => setGenerateBusinesses(checked as boolean)}
                  />
                  <Label htmlFor="generate-businesses" className="cursor-pointer">
                    Generate businesses and economy
                  </Label>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                      Procedural Society Generation
                    </p>
                    <p className="text-purple-600 dark:text-purple-400">
                      This will create a complete country with settlements, characters, families, and genealogies spanning {generations} generations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleProceduralGenerate} 
                disabled={isGenerating || !form.name}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Society
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
