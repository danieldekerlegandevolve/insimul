import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  PlayCircle, 
  RefreshCw, 
  Copy,
  Check,
  Sparkles,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Grammar {
  id: string;
  name: string;
  description: string | null;
  grammar: Record<string, string | string[]>;
  tags: string[];
}

interface GrammarTestConsoleProps {
  grammar: Grammar;
  onClose: () => void;
}

export function GrammarTestConsole({ grammar, onClose }: GrammarTestConsoleProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [results, setResults] = useState<string[]>([]);
  const [iterationCount, setIterationCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Extract variable placeholders from grammar
  const extractVariables = (): string[] => {
    const varSet = new Set<string>();
    const regex = /#(\w+)#/g;
    
    Object.values(grammar.grammar).forEach((value) => {
      const strings = Array.isArray(value) ? value : [value];
      strings.forEach((str) => {
        let match;
        while ((match = regex.exec(str)) !== null) {
          if (!grammar.grammar[match[1]]) {
            // This is a variable that needs to be provided
            varSet.add(match[1]);
          }
        }
      });
    });
    
    return Array.from(varSet);
  };

  const detectedVariables = extractVariables();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/grammars/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grammar: grammar.grammar,
          variables,
          iterations: iterationCount,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error generating:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate text. Make sure your grammar is valid.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
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

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(results.join('\n\n'));
      toast({
        title: 'Copied',
        description: 'All results copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onClose} className="gap-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Grammars
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{grammar.name}</h2>
          <p className="text-muted-foreground">{grammar.description || 'Test grammar'}</p>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <Button variant="outline" onClick={handleCopyAll} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy All
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left panel - Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Set variables and generation options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Iteration count */}
            <div className="space-y-2">
              <Label htmlFor="iterations">Number of Variations</Label>
              <Input
                id="iterations"
                type="number"
                min={1}
                max={20}
                value={iterationCount}
                onChange={(e) => setIterationCount(parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground">
                Generate 1-20 different variations
              </p>
            </div>

            {/* Variables */}
            {detectedVariables.length > 0 && (
              <div className="space-y-3">
                <Label>Variables</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Provide values for undefined symbols
                </p>
                {detectedVariables.map((varName) => (
                  <div key={varName} className="space-y-1">
                    <Label htmlFor={varName} className="text-sm font-mono">
                      #{varName}#
                    </Label>
                    <Input
                      id={varName}
                      value={variables[varName] || ''}
                      onChange={(e) =>
                        setVariables({ ...variables, [varName]: e.target.value })
                      }
                      placeholder={`Value for ${varName}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Grammar info */}
            <div className="space-y-2">
              <Label>Grammar Info</Label>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Symbols:</span>
                  <Badge variant="secondary">{Object.keys(grammar.grammar).length}</Badge>
                </div>
                {grammar.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {grammar.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full gap-2"
              size="lg"
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        {/* Right panel - Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Results</CardTitle>
            <CardDescription>
              {results.length > 0
                ? `${results.length} variations generated`
                : 'Click Generate to see results'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results yet</h3>
                <p className="text-muted-foreground">
                  Configure your settings and click Generate to see output
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <Card key={index} className="border-muted">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Variation {index + 1}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{result}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopy(result, index)}
                            className="shrink-0"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grammar structure reference */}
      <Card>
        <CardHeader>
          <CardTitle>Grammar Structure</CardTitle>
          <CardDescription>Reference for how this grammar is structured</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <pre className="text-xs font-mono">
              {JSON.stringify(grammar.grammar, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
