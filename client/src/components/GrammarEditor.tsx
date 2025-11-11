import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  X, 
  Plus, 
  Minus, 
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Grammar {
  id: string;
  worldId: string;
  name: string;
  description: string | null;
  grammar: Record<string, string | string[]>;
  tags: string[];
  isActive: boolean;
}

interface GrammarEditorProps {
  grammar: Grammar | null;
  worldId: string;
  isCreating: boolean;
  onSave: (grammar: Partial<Grammar>) => Promise<void>;
  onCancel: () => void;
}

interface GrammarSymbol {
  key: string;
  values: string[];
}

export function GrammarEditor({ grammar, worldId, isCreating, onSave, onCancel }: GrammarEditorProps) {
  const [name, setName] = useState(grammar?.name || '');
  const [description, setDescription] = useState(grammar?.description || '');
  const [isActive, setIsActive] = useState(grammar?.isActive ?? true);
  const [tags, setTags] = useState<string[]>(grammar?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [symbols, setSymbols] = useState<GrammarSymbol[]>([]);
  const [grammarJson, setGrammarJson] = useState('');
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (grammar?.grammar) {
      // Convert grammar object to symbols array
      const symbolsArray = Object.entries(grammar.grammar).map(([key, value]) => ({
        key,
        values: Array.isArray(value) ? value : [value],
      }));
      setSymbols(symbolsArray);
      setGrammarJson(JSON.stringify(grammar.grammar, null, 2));
    } else {
      // Default starter grammar
      const defaultGrammar = {
        origin: ['#greeting# #name#!'],
        greeting: ['Hello', 'Hi', 'Greetings'],
        name: ['World', 'Friend', 'Traveler'],
      };
      const symbolsArray = Object.entries(defaultGrammar).map(([key, value]) => ({
        key,
        values: value,
      }));
      setSymbols(symbolsArray);
      setGrammarJson(JSON.stringify(defaultGrammar, null, 2));
    }
  }, [grammar]);

  const handleAddSymbol = () => {
    setSymbols([...symbols, { key: '', values: [''] }]);
  };

  const handleRemoveSymbol = (index: number) => {
    setSymbols(symbols.filter((_, i) => i !== index));
  };

  const handleSymbolKeyChange = (index: number, newKey: string) => {
    const newSymbols = [...symbols];
    newSymbols[index].key = newKey;
    setSymbols(newSymbols);
    syncToJson(newSymbols);
  };

  const handleSymbolValueChange = (symbolIndex: number, valueIndex: number, newValue: string) => {
    const newSymbols = [...symbols];
    newSymbols[symbolIndex].values[valueIndex] = newValue;
    setSymbols(newSymbols);
    syncToJson(newSymbols);
  };

  const handleAddValue = (symbolIndex: number) => {
    const newSymbols = [...symbols];
    newSymbols[symbolIndex].values.push('');
    setSymbols(newSymbols);
    syncToJson(newSymbols);
  };

  const handleRemoveValue = (symbolIndex: number, valueIndex: number) => {
    const newSymbols = [...symbols];
    newSymbols[symbolIndex].values = newSymbols[symbolIndex].values.filter((_, i) => i !== valueIndex);
    setSymbols(newSymbols);
    syncToJson(newSymbols);
  };

  const syncToJson = (symbolsArray: GrammarSymbol[]) => {
    const grammarObject: Record<string, string | string[]> = {};
    symbolsArray.forEach(symbol => {
      if (symbol.key.trim()) {
        grammarObject[symbol.key] = symbol.values.length === 1 ? symbol.values[0] : symbol.values;
      }
    });
    setGrammarJson(JSON.stringify(grammarObject, null, 2));
  };

  const handleJsonChange = (newJson: string) => {
    setGrammarJson(newJson);
    setJsonError(null);
    
    try {
      const parsed = JSON.parse(newJson);
      const symbolsArray = Object.entries(parsed).map(([key, value]) => ({
        key,
        values: Array.isArray(value) ? value : [value],
      }));
      setSymbols(symbolsArray);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const validateGrammar = (): string | null => {
    if (!name.trim()) return 'Grammar name is required';
    if (symbols.length === 0) return 'Grammar must have at least one symbol';
    if (!symbols.some(s => s.key === 'origin')) return 'Grammar must have an "origin" symbol';
    
    for (const symbol of symbols) {
      if (!symbol.key.trim()) return 'All symbols must have a name';
      if (symbol.values.length === 0 || symbol.values.every(v => !v.trim())) {
        return `Symbol "${symbol.key}" must have at least one value`;
      }
    }
    
    return null;
  };

  const handleSave = async () => {
    const error = validateGrammar();
    if (error) {
      toast({
        title: 'Validation Error',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const grammarObject: Record<string, string | string[]> = {};
      symbols.forEach(symbol => {
        if (symbol.key.trim()) {
          grammarObject[symbol.key] = symbol.values.length === 1 
            ? symbol.values[0] 
            : symbol.values.filter(v => v.trim());
        }
      });

      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        grammar: grammarObject,
        tags,
        isActive,
      });
    } catch (error) {
      console.error('Error saving grammar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isCreating ? 'Create Grammar' : 'Edit Grammar'}
          </h2>
          <p className="text-muted-foreground">
            Define Tracery symbols and their possible values
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left sidebar - Metadata */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Grammar Details</CardTitle>
            <CardDescription>Basic information about this grammar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., fantasy_names"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this grammar generate?"
                rows={3}
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag..."
                />
                <Button size="icon" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All grammars must have an "origin" symbol as the starting point.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Right side - Grammar editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grammar Structure</CardTitle>
                <CardDescription>Define symbols and their possible expansions</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={editMode === 'visual' ? 'default' : 'outline'}
                  onClick={() => setEditMode('visual')}
                >
                  Visual
                </Button>
                <Button
                  size="sm"
                  variant={editMode === 'json' ? 'default' : 'outline'}
                  onClick={() => setEditMode('json')}
                >
                  JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editMode === 'visual' ? (
              <div className="space-y-4">
                {symbols.map((symbol, symbolIndex) => (
                  <Card key={symbolIndex} className="border-muted">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Symbol key */}
                        <div className="flex items-center gap-2">
                          <Input
                            value={symbol.key}
                            onChange={(e) => handleSymbolKeyChange(symbolIndex, e.target.value)}
                            placeholder="Symbol name (e.g., origin, name, greeting)"
                            className="flex-1 font-mono"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveSymbol(symbolIndex)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Symbol values */}
                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                          {symbol.values.map((value, valueIndex) => (
                            <div key={valueIndex} className="flex items-center gap-2">
                              <Input
                                value={value}
                                onChange={(e) =>
                                  handleSymbolValueChange(symbolIndex, valueIndex, e.target.value)
                                }
                                placeholder="Value (use #symbol# to reference other symbols)"
                                className="flex-1 font-mono text-sm"
                              />
                              {symbol.values.length > 1 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveValue(symbolIndex, valueIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddValue(symbolIndex)}
                            className="gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            Add Value
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={handleAddSymbol} variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Symbol
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={grammarJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="font-mono text-sm min-h-[500px]"
                  placeholder='{\n  "origin": ["#greeting# #name#!"],\n  "greeting": ["Hello", "Hi"],\n  "name": ["World"]\n}'
                />
                {jsonError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{jsonError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation info */}
      {symbols.some(s => s.key === 'origin') && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✓ Grammar has required "origin" symbol
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
