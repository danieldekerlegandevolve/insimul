import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Minus,
  RefreshCw,
  Save,
  FileText,
  Wand2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SyllablePool {
  name: string;
  syllables: string[];
}

interface NamePattern {
  pattern: string;
  weight: number;
}

interface NamePatternEditorProps {
  worldId: string;
  initialGrammar?: {
    name: string;
    description: string;
    grammar: Record<string, string | string[]>;
  };
  onSave: (grammar: any) => void;
  onCancel: () => void;
}

export function NamePatternEditor({
  worldId,
  initialGrammar,
  onSave,
  onCancel,
}: NamePatternEditorProps) {
  const [grammarName, setGrammarName] = useState(initialGrammar?.name || '');
  const [description, setDescription] = useState(initialGrammar?.description || '');
  const [nameType, setNameType] = useState<'full' | 'first' | 'last'>('full');
  const [syllablePools, setSyllablePools] = useState<SyllablePool[]>([
    { name: 'first', syllables: [] },
    { name: 'middle', syllables: [] },
    { name: 'last', syllables: [] },
  ]);
  const [patterns, setPatterns] = useState<NamePattern[]>([
    { pattern: '#first##last#', weight: 1 },
  ]);
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Initialize from existing grammar if provided
  useState(() => {
    if (initialGrammar?.grammar) {
      // Parse existing grammar structure
      const pools: SyllablePool[] = [];
      Object.entries(initialGrammar.grammar).forEach(([key, value]) => {
        if (key !== 'origin' && Array.isArray(value)) {
          pools.push({ name: key, syllables: value });
        }
      });
      if (pools.length > 0) {
        setSyllablePools(pools);
      }
      
      // Extract patterns from origin
      const origin = initialGrammar.grammar.origin;
      if (Array.isArray(origin)) {
        setPatterns(origin.map(p => ({ pattern: p, weight: 1 })));
      } else if (typeof origin === 'string') {
        setPatterns([{ pattern: origin, weight: 1 }]);
      }
    }
  });

  const handleAddSyllablePool = () => {
    setSyllablePools([
      ...syllablePools,
      { name: `pool_${syllablePools.length + 1}`, syllables: [] },
    ]);
  };

  const handleRemoveSyllablePool = (index: number) => {
    setSyllablePools(syllablePools.filter((_, i) => i !== index));
  };

  const handleUpdatePool = (index: number, field: keyof SyllablePool, value: any) => {
    const updated = [...syllablePools];
    updated[index] = { ...updated[index], [field]: value };
    setSyllablePools(updated);
  };

  const handleAddSyllables = (poolIndex: number, syllablesText: string) => {
    const syllables = syllablesText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    const updated = [...syllablePools];
    updated[poolIndex].syllables = Array.from(new Set([...updated[poolIndex].syllables, ...syllables]));
    setSyllablePools(updated);
  };

  const handleRemoveSyllable = (poolIndex: number, syllableIndex: number) => {
    const updated = [...syllablePools];
    updated[poolIndex].syllables = updated[poolIndex].syllables.filter(
      (_, i) => i !== syllableIndex
    );
    setSyllablePools(updated);
  };

  const handleAddPattern = () => {
    setPatterns([...patterns, { pattern: '', weight: 1 }]);
  };

  const handleRemovePattern = (index: number) => {
    setPatterns(patterns.filter((_, i) => i !== index));
  };

  const handleUpdatePattern = (index: number, field: keyof NamePattern, value: any) => {
    const updated = [...patterns];
    updated[index] = { ...updated[index], [field]: value };
    setPatterns(updated);
  };

  const buildGrammar = (): Record<string, string | string[]> => {
    const grammar: Record<string, string | string[]> = {
      origin: patterns.map((p) => p.pattern),
    };

    syllablePools.forEach((pool) => {
      if (pool.syllables.length > 0) {
        grammar[pool.name] = pool.syllables;
      }
    });

    return grammar;
  };

  const handleGeneratePreview = async () => {
    if (patterns.length === 0 || patterns.every((p) => !p.pattern.trim())) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one name pattern',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const grammar = buildGrammar();
      
      const response = await fetch('/api/grammars/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grammar,
          iterations: 20,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate preview');

      const data = await response.json();
      setPreviewNames(data.results);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate name preview',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!grammarName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a grammar name',
        variant: 'destructive',
      });
      return;
    }

    if (patterns.length === 0 || patterns.every((p) => !p.pattern.trim())) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one name pattern',
        variant: 'destructive',
      });
      return;
    }

    const grammar = buildGrammar();
    
    onSave({
      name: grammarName,
      description: description || `${nameType} name generator`,
      grammar,
      tags: ['names', nameType, 'generator'],
      isActive: true,
    });
  };

  const handleCopyName = async (name: string, index: number) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const quickTemplates = {
    fantasy: {
      pools: [
        { name: 'first', syllables: ['Ar', 'Bel', 'Cel', 'Dar', 'El', 'Fir', 'Gal', 'Har'] },
        { name: 'middle', syllables: ['an', 'en', 'in', 'on', 'ar', 'or', 'el', 'il'] },
        { name: 'last', syllables: ['dor', 'mir', 'wen', 'rion', 'dil', 'wyn', 'thil', 'dan'] },
      ],
      patterns: ['#first##middle##last#', '#first##last#'],
    },
    medieval: {
      pools: [
        { name: 'first', syllables: ['Wil', 'Rob', 'John', 'Rich', 'Ed', 'Thom', 'Wal', 'Hugh'] },
        { name: 'suffix', syllables: ['liam', 'ert', 'ard', 'ward', 'mund', 'as', 'ter', 'bert'] },
      ],
      patterns: ['#first##suffix#'],
    },
    scifi: {
      pools: [
        { name: 'prefix', syllables: ['Zar', 'Kex', 'Vex', 'Nex', 'Qua', 'Xen', 'Zor', 'Kry'] },
        { name: 'core', syllables: ['on', 'ax', 'ix', 'ex', 'ar', 'or', 'an', 'en'] },
        { name: 'suffix', syllables: ['os', 'us', 'is', 'as', 'on', 'el', 'ar', 'or'] },
      ],
      patterns: ['#prefix##core##suffix#', '#prefix##suffix#'],
    },
  };

  const loadTemplate = (template: keyof typeof quickTemplates) => {
    const t = quickTemplates[template];
    setSyllablePools(t.pools);
    setPatterns(t.patterns.map(p => ({ pattern: p, weight: 1 })));
    toast({
      title: 'Template loaded',
      description: `Loaded ${template} name template`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Name Pattern Editor</h2>
          <p className="text-muted-foreground">
            Create Tracery grammars for procedural name generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Grammar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Define syllables and patterns for name generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grammarName">Grammar Name *</Label>
                <Input
                  id="grammarName"
                  value={grammarName}
                  onChange={(e) => setGrammarName(e.target.value)}
                  placeholder="e.g., elven_names"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameType">Name Type</Label>
                <Select value={nameType} onValueChange={(v: any) => setNameType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Names</SelectItem>
                    <SelectItem value="first">First Names Only</SelectItem>
                    <SelectItem value="last">Last Names Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this name style"
              />
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <Label>Quick Start Templates</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadTemplate('fantasy')}
                  className="gap-2"
                >
                  <Sparkles className="h-3 w-3" />
                  Fantasy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadTemplate('medieval')}
                  className="gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Medieval
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadTemplate('scifi')}
                  className="gap-2"
                >
                  <Wand2 className="h-3 w-3" />
                  Sci-Fi
                </Button>
              </div>
            </div>

            <Tabs defaultValue="syllables" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="syllables">Syllable Pools</TabsTrigger>
                <TabsTrigger value="patterns">Name Patterns</TabsTrigger>
              </TabsList>

              {/* Syllable Pools Tab */}
              <TabsContent value="syllables" className="space-y-4">
                {syllablePools.map((pool, poolIndex) => (
                  <Card key={poolIndex} className="border-muted">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={pool.name}
                            onChange={(e) =>
                              handleUpdatePool(poolIndex, 'name', e.target.value)
                            }
                            placeholder="Pool name (e.g., first, middle, last)"
                            className="flex-1 font-mono text-sm"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveSyllablePool(poolIndex)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add syllables (comma or newline separated)"
                            className="h-20 font-mono text-sm"
                            onBlur={(e) => {
                              handleAddSyllables(poolIndex, e.target.value);
                              e.target.value = '';
                            }}
                          />
                          
                          <div className="flex flex-wrap gap-1">
                            {pool.syllables.map((syllable, syllableIndex) => (
                              <Badge
                                key={syllableIndex}
                                variant="secondary"
                                className="gap-1"
                              >
                                {syllable}
                                <button
                                  onClick={() =>
                                    handleRemoveSyllable(poolIndex, syllableIndex)
                                  }
                                  className="hover:text-destructive"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={handleAddSyllablePool} variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Syllable Pool
                </Button>
              </TabsContent>

              {/* Patterns Tab */}
              <TabsContent value="patterns" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use #poolname# to reference syllable pools. Example: #first##last#
                </p>
                
                {patterns.map((pattern, index) => (
                  <Card key={index} className="border-muted">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Input
                          value={pattern.pattern}
                          onChange={(e) =>
                            handleUpdatePattern(index, 'pattern', e.target.value)
                          }
                          placeholder="#first##last#"
                          className="flex-1 font-mono"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemovePattern(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={handleAddPattern} variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Pattern
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Test your name patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGeneratePreview}
              disabled={generating}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Generate Names
                </>
              )}
            </Button>

            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {previewNames.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Click "Generate Names" to preview
                  </div>
                ) : (
                  previewNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded border border-muted hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopyName(name, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
