import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GrammarTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  grammar: Record<string, string | string[]>;
}

interface GenerateGrammarDialogProps {
  worldId: string;
  onGenerated: (grammar: any) => void;
  children?: React.ReactNode;
}

export function GenerateGrammarDialog({ worldId, onGenerated, children }: GenerateGrammarDialogProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState<GrammarTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<'ai' | 'template' | 'examples'>('ai');
  
  // AI generation fields
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [symbolCount, setSymbolCount] = useState(5);
  
  // Template fields
  const [selectedTemplate, setSelectedTemplate] = useState<GrammarTemplate | null>(null);
  
  // Examples fields
  const [examples, setExamples] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/grammars/templates');
      if (!response.ok) throw new Error('Failed to load templates');
      
      const data = await response.json();
      setTemplates(data.templates);
      setCategories(data.categories);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load grammar templates',
        variant: 'destructive',
      });
    }
  };

  const handleAIGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a description',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/grammars/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          theme: theme || undefined,
          complexity,
          symbolCount,
          worldId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to generate grammar');
      }

      const generated = await response.json();
      
      toast({
        title: 'Grammar generated!',
        description: `Created "${generated.name}" with ${Object.keys(generated.grammar).length} symbols`,
      });

      onGenerated(generated);
      handleClose();
    } catch (error) {
      console.error('Error generating grammar:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate grammar',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleTemplateSelect = (template: GrammarTemplate) => {
    setSelectedTemplate(template);
  };

  const handleTemplateUse = () => {
    if (!selectedTemplate) return;

    const generated = {
      name: selectedTemplate.name.toLowerCase().replace(/\s+/g, '_'),
      description: selectedTemplate.description,
      grammar: selectedTemplate.grammar,
      tags: selectedTemplate.tags,
    };

    toast({
      title: 'Template loaded!',
      description: `Using template "${selectedTemplate.name}"`,
    });

    onGenerated(generated);
    handleClose();
  };

  const handleExamplesGenerate = async () => {
    const exampleLines = examples.split('\n').filter(line => line.trim());
    
    if (exampleLines.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'Please provide at least 2 examples',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/grammars/from-examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examples: exampleLines,
          symbolName: 'origin',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to generate from examples');
      }

      const data = await response.json();
      
      const generated = {
        name: 'grammar_from_examples',
        description: 'Generated from example outputs',
        grammar: data.grammar,
        tags: ['generated', 'examples'],
      };

      toast({
        title: 'Grammar generated!',
        description: 'Created grammar from your examples',
      });

      onGenerated(generated);
      handleClose();
    } catch (error) {
      console.error('Error generating from examples:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate grammar',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form
    setDescription('');
    setTheme('');
    setComplexity('medium');
    setSymbolCount(5);
    setSelectedTemplate(null);
    setExamples('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Grammar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Grammar</DialogTitle>
          <DialogDescription>
            Use AI, templates, or examples to create a new Tracery grammar
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="gap-2">
              <Wand2 className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-2">
              <Sparkles className="h-4 w-4" />
              From Examples
            </TabsTrigger>
          </TabsList>

          {/* AI Generation Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you want the grammar to generate (e.g., 'Combat descriptions with medieval weapons')"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme (optional)</Label>
                  <Input
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g., fantasy, sci-fi, medieval"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select value={complexity} onValueChange={(v: any) => setComplexity(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (3-5 symbols)</SelectItem>
                      <SelectItem value="medium">Medium (5-8 symbols)</SelectItem>
                      <SelectItem value="complex">Complex (8-12 symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbolCount">Symbol Count: {symbolCount}</Label>
                <input
                  id="symbolCount"
                  type="range"
                  min="3"
                  max="15"
                  value={symbolCount}
                  onChange={(e) => setSymbolCount(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleAIGenerate}
                disabled={generating || !description.trim()}
                className="w-full gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="template" className="space-y-4">
            <div className="grid gap-3 max-h-[400px] overflow-y-auto">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleTemplateUse}
              disabled={!selectedTemplate}
              className="w-full gap-2"
            >
              <FileText className="h-4 w-4" />
              Use Template
            </Button>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examples">Example Outputs (one per line) *</Label>
              <Textarea
                id="examples"
                value={examples}
                onChange={(e) => setExamples(e.target.value)}
                placeholder="The knight charges the enemy&#10;The warrior attacks with fury&#10;The hero strikes boldly"
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                AI will analyze your examples and create a grammar that generates similar outputs
              </p>
            </div>

            <Button
              onClick={handleExamplesGenerate}
              disabled={generating || examples.split('\n').filter(l => l.trim()).length < 2}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate from Examples
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
