import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, Plus, Sparkles, FileText, TreePine, Users, Map } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorldSchema, type InsertWorld } from "@shared/schema";
import { z } from "zod";

const createWorldFormSchema = insertWorldSchema.extend({
  name: z.string().min(1, "World name is required"),
  description: z.string().optional(),
});

type CreateWorldForm = z.infer<typeof createWorldFormSchema>;

const WORLD_TYPES = [
  { value: 'medieval-fantasy', label: 'Medieval Fantasy', description: 'Knights, castles, magic, and dragons' },
  { value: 'high-fantasy', label: 'High Fantasy', description: 'Epic quests, multiple races, powerful magic' },
  { value: 'low-fantasy', label: 'Low Fantasy', description: 'Realistic with subtle magical elements' },
  { value: 'dark-fantasy', label: 'Dark Fantasy', description: 'Gothic horror with supernatural elements' },
  { value: 'urban-fantasy', label: 'Urban Fantasy', description: 'Modern city with hidden magical world' },
  { value: 'sci-fi-space', label: 'Space Opera', description: 'Interstellar travel, alien civilizations, galactic empires' },
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'High tech, low life, corporate dystopia' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic', description: 'Survival in a devastated world' },
  { value: 'steampunk', label: 'Steampunk', description: 'Victorian era with advanced steam technology' },
  { value: 'dieselpunk', label: 'Dieselpunk', description: '1920s-1950s aesthetic with advanced diesel tech' },
  { value: 'historical-ancient', label: 'Ancient Civilizations', description: 'Rome, Greece, Egypt, or other ancient cultures' },
  { value: 'historical-medieval', label: 'Historical Medieval', description: 'Realistic medieval Europe or Asia' },
  { value: 'historical-renaissance', label: 'Renaissance', description: 'Art, science, and political intrigue' },
  { value: 'historical-victorian', label: 'Victorian Era', description: 'Industrial revolution, colonialism, social change' },
  { value: 'wild-west', label: 'Wild West', description: 'Cowboys, outlaws, frontier towns' },
  { value: 'modern-realistic', label: 'Modern Realistic', description: 'Contemporary world with real-world issues' },
  { value: 'superhero', label: 'Superhero', description: 'Powered individuals protecting society' },
  { value: 'horror', label: 'Horror', description: 'Supernatural terrors and psychological dread' },
  { value: 'mythological', label: 'Mythological', description: 'Gods, myths, and legendary creatures' },
  { value: 'solarpunk', label: 'Solarpunk', description: 'Optimistic future with sustainable technology' },
];

const GAME_TYPES = [
  { value: 'rpg', label: 'RPG', description: 'Character progression, quests, and story-driven gameplay' },
  { value: 'action', label: 'Action', description: 'Fast-paced combat and reflexes' },
  { value: 'fighting', label: 'Fighting', description: 'One-on-one combat with various characters' },
  { value: 'platformer', label: 'Platformer', description: 'Jumping and navigating through levels' },
  { value: 'strategy', label: 'Strategy', description: 'Tactical decision-making and resource management' },
  { value: 'survival', label: 'Survival', description: 'Resource gathering, crafting, and staying alive' },
  { value: 'shooter', label: 'Shooter', description: 'Ranged combat and precision aiming' },
  { value: 'sandbox', label: 'Sandbox', description: 'Open-world exploration and creativity' },
  { value: 'city-building', label: 'City-Building', description: 'Urban planning and infrastructure management' },
  { value: 'simulation', label: 'Simulation', description: 'Realistic systems and life simulation' },
  { value: 'puzzle', label: 'Puzzle', description: 'Logic and problem-solving challenges' },
  { value: 'language-learning', label: 'Language Learning', description: 'Vocabulary, grammar, and cultural immersion for any language' },
  { value: 'educational', label: 'Educational', description: 'Learning through interactive experiences' },
  { value: 'adventure', label: 'Adventure', description: 'Exploration and narrative-focused gameplay' },
  { value: 'roguelike', label: 'Roguelike', description: 'Procedural generation with permadeath' },
];

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Polish',
  'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Hebrew', 'Hindi', 'Bengali',
  'Turkish', 'Greek', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Czech', 'Hungarian',
  'Romanian', 'Thai', 'Vietnamese', 'Indonesian', 'Swahili'
];

interface WorldCreateDialogProps {
  onCreateWorld: (data: InsertWorld, generateContent?: boolean, worldType?: string, customPrompt?: string, gameType?: string, customLabel?: string) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WorldCreateDialog({ onCreateWorld, isLoading = false, children, open: controlledOpen, onOpenChange }: WorldCreateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'blank' | 'procedural'>('blank');
  const [inputMode, setInputMode] = useState<'preset' | 'custom'>('preset');
  const [selectedWorldType, setSelectedWorldType] = useState(WORLD_TYPES[0].value);
  const [selectedGameType, setSelectedGameType] = useState<string | undefined>(undefined);
  const [targetLanguage, setTargetLanguage] = useState<string | undefined>(undefined);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  
  // Procedural generation settings
  const [settlementName, setSettlementName] = useState('New Settlement');
  const [settlementType, setSettlementType] = useState<'village' | 'town' | 'city'>('town');
  const [terrain, setTerrain] = useState<'plains' | 'hills' | 'mountains' | 'coast' | 'river' | 'forest' | 'desert'>('plains');
  const [foundedYear, setFoundedYear] = useState(1850);
  const [numFoundingFamilies, setNumFoundingFamilies] = useState(10);
  const [generations, setGenerations] = useState(4);
  const [marriageRate, setMarriageRate] = useState(0.7);
  const [fertilityRate, setFertilityRate] = useState(0.6);
  const [deathRate, setDeathRate] = useState(0.3);
  const [generateGeography, setGenerateGeography] = useState(true);
  const [generateGenealogy, setGenerateGenealogy] = useState(true);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<CreateWorldForm>({
    resolver: zodResolver(createWorldFormSchema),
    defaultValues: {
      name: "",
      description: "",
      config: {},
      worldData: {},
      historicalEvents: [],
      generationConfig: {},
    },
  });

  const loadPreset = (presetName: 'medieval' | 'colonial' | 'modern' | 'fantasy') => {
    const presets = {
      medieval: {
        settlementType: 'village' as const,
        terrain: 'plains' as const,
        foundedYear: 1200,
        numFoundingFamilies: 8,
        generations: 5,
        marriageRate: 0.8,
        fertilityRate: 0.7,
        deathRate: 0.4
      },
      colonial: {
        settlementType: 'town' as const,
        terrain: 'coast' as const,
        foundedYear: 1650,
        numFoundingFamilies: 12,
        generations: 4,
        marriageRate: 0.75,
        fertilityRate: 0.65,
        deathRate: 0.35
      },
      modern: {
        settlementType: 'city' as const,
        terrain: 'plains' as const,
        foundedYear: 1950,
        numFoundingFamilies: 20,
        generations: 3,
        marriageRate: 0.6,
        fertilityRate: 0.5,
        deathRate: 0.2
      },
      fantasy: {
        settlementType: 'town' as const,
        terrain: 'forest' as const,
        foundedYear: 1000,
        numFoundingFamilies: 15,
        generations: 6,
        marriageRate: 0.7,
        fertilityRate: 0.6,
        deathRate: 0.3
      }
    };
    
    const preset = presets[presetName];
    setSettlementType(preset.settlementType);
    setTerrain(preset.terrain);
    setFoundedYear(preset.foundedYear);
    setNumFoundingFamilies(preset.numFoundingFamilies);
    setGenerations(preset.generations);
    setMarriageRate(preset.marriageRate);
    setFertilityRate(preset.fertilityRate);
    setDeathRate(preset.deathRate);
  };

  const handleSubmit = (data: CreateWorldForm) => {
    const generateContent = creationMode === 'procedural';
    const worldType = inputMode === 'preset' ? selectedWorldType : undefined;
    const prompt = inputMode === 'custom' ? customPrompt : undefined;
    const label = inputMode === 'custom' ? customLabel : undefined;

    // Add target language for language-learning worlds
    if (selectedGameType === 'language-learning' && targetLanguage) {
      data.targetLanguage = targetLanguage;
    }

    // Add procedural generation config to world data
    if (generateContent) {
      data.generationConfig = {
        settlementName,
        settlementType,
        terrain,
        foundedYear,
        numFoundingFamilies,
        generations,
        marriageRate,
        fertilityRate,
        deathRate,
        generateGeography,
        generateGenealogy,
        gameType: selectedGameType
      };
    }

    onCreateWorld(data, generateContent, worldType, prompt, selectedGameType, label);
    setOpen(false);
    form.reset();
    setCreationMode('blank');
    setInputMode('preset');
    setSelectedWorldType(WORLD_TYPES[0].value);
    setSelectedGameType(undefined);
    setTargetLanguage(undefined);
    setCustomPrompt('');
    setCustomLabel('');
    // Reset procedural settings
    setSettlementName('New Settlement');
    setSettlementType('town');
    setTerrain('plains');
    setFoundedYear(1850);
    setNumFoundingFamilies(10);
    setGenerations(4);
    setMarriageRate(0.7);
    setFertilityRate(0.6);
    setDeathRate(0.3);
    setGenerateGeography(true);
    setGenerateGenealogy(true);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only render trigger when not controlled (no open prop provided) */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {children || (
            <Button size="sm" data-testid="button-create-world" className="shrink-0">
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Create World</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Create New World
          </DialogTitle>
          <DialogDescription>
            Create a new world to contain your narratives, characters, and simulations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Creation Mode Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Creation Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={creationMode} onValueChange={(v) => setCreationMode(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blank" id="blank" />
                  <Label htmlFor="blank" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Blank World</div>
                        <div className="text-sm text-muted-foreground">Start with an empty world and add content manually</div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <RadioGroupItem value="procedural" id="procedural" />
                  <Label htmlFor="procedural" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Procedurally Generated</div>
                        <div className="text-sm text-muted-foreground">Auto-generate societies, rules, actions, quests, and grammars</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="name">World Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              data-testid="input-world-name"
              placeholder="e.g., Medieval Kingdom, Futuristic Colony"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              data-testid="textarea-world-description"
              placeholder="Describe your world's setting, theme, and key characteristics..."
              rows={3}
            />
          </div>

          {/* Procedural Generation Options */}
          {creationMode === 'procedural' && (
            <div className="space-y-4">
              {/* Quick Start Presets */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Start Presets</CardTitle>
                  <CardDescription>Load pre-configured settings</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  <Button type="button" variant="outline" onClick={() => loadPreset('medieval')}>
                    <TreePine className="w-4 h-4 mr-2" />
                    Medieval Village
                  </Button>
                  <Button type="button" variant="outline" onClick={() => loadPreset('colonial')}>
                    Colonial Town
                  </Button>
                  <Button type="button" variant="outline" onClick={() => loadPreset('modern')}>
                    Modern City
                  </Button>
                  <Button type="button" variant="outline" onClick={() => loadPreset('fantasy')}>
                    Fantasy Realm
                  </Button>
                </CardContent>
              </Card>

              {/* Settlement Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    Settlement Configuration
                  </CardTitle>
                  <CardDescription>Configure your initial settlement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Settlement Name</Label>
                      <Input
                        value={settlementName}
                        onChange={(e) => setSettlementName(e.target.value)}
                        placeholder="e.g., Thornbrook"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Settlement Type</Label>
                      <Select value={settlementType} onValueChange={(v: any) => setSettlementType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="village">Village (~500)</SelectItem>
                          <SelectItem value="town">Town (~5,000)</SelectItem>
                          <SelectItem value="city">City (~50,000)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Terrain</Label>
                      <Select value={terrain} onValueChange={(v: any) => setTerrain(v)}>
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
                      <Label>Founded Year</Label>
                      <Input
                        type="number"
                        value={foundedYear}
                        onChange={(e) => setFoundedYear(parseInt(e.target.value) || 1850)}
                        placeholder="e.g., 1850"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Population Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Population Settings
                  </CardTitle>
                  <CardDescription>Configure genealogy generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Founding Families: {numFoundingFamilies}</Label>
                    <Slider
                      value={[numFoundingFamilies]}
                      onValueChange={([v]) => setNumFoundingFamilies(v)}
                      min={2}
                      max={30}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Generations: {generations}</Label>
                    <Slider
                      value={[generations]}
                      onValueChange={([v]) => setGenerations(v)}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Marriage Rate: {(marriageRate * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[marriageRate * 100]}
                        onValueChange={([v]) => setMarriageRate(v / 100)}
                        min={20}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Fertility Rate: {(fertilityRate * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[fertilityRate * 100]}
                        onValueChange={([v]) => setFertilityRate(v / 100)}
                        min={20}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Death Rate: {(deathRate * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[deathRate * 100]}
                        onValueChange={([v]) => setDeathRate(v / 100)}
                        min={10}
                        max={80}
                        step={5}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gen-geography"
                        checked={generateGeography}
                        onCheckedChange={(checked) => setGenerateGeography(checked as boolean)}
                      />
                      <Label htmlFor="gen-geography" className="cursor-pointer text-sm">
                        Generate geography (districts, lots, buildings)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gen-genealogy"
                        checked={generateGenealogy}
                        onCheckedChange={(checked) => setGenerateGenealogy(checked as boolean)}
                      />
                      <Label htmlFor="gen-genealogy" className="cursor-pointer text-sm">
                        Generate genealogy (families, characters, relationships)
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theme/Type Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">World Theme</CardTitle>
                  <CardDescription>Choose a preset genre or describe your ideal world</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preset">Preset World Types</TabsTrigger>
                      <TabsTrigger value="custom">Custom Description</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preset" className="space-y-2">
                      <Label>World Type</Label>
                      <Select value={selectedWorldType} onValueChange={setSelectedWorldType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {WORLD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-3">
                      <div className="space-y-2">
                        <Label>Custom World Type Label</Label>
                        <Input
                          value={customLabel}
                          onChange={(e) => setCustomLabel(e.target.value)}
                          placeholder="e.g., Maritime Pirate World, Steampunk Western"
                        />
                        <p className="text-xs text-muted-foreground">
                          A short label for your custom world type (used for grammar generation)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Custom World Description</Label>
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Describe the type of world you want to generate. For example: 'A maritime world where pirate guilds control trade routes and sea monsters are real...'"
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Detailed description of your world's theme, setting, and characteristics
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Game Type Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Game Type (Optional)</CardTitle>
                  <CardDescription>Select the type of game or simulation this world is designed for</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>Game Type</Label>
                  <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a game type (optional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {GAME_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGameType === 'language-learning' && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          Language Learning worlds feature countries, cities, towns, and villages tailored for vocabulary and grammar practice in any language. Generate realistic or fictional locations optimized for immersive language acquisition.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Target Language</Label>
                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target language" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Choose the language learners will practice in this world
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-world"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit-world"
            >
              {isLoading ? "Creating..." : "Create World"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}