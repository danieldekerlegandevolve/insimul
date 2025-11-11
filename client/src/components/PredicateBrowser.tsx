import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Sparkles, Code } from 'lucide-react';

interface Predicate {
  name: string;
  arity: number;
  description?: string;
  category?: string;
  examples: string[];
  source: 'core' | 'discovered';
  builtIn?: boolean;
  usageCount?: number;
  confidence?: 'high' | 'medium' | 'low';
  args?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}

interface PredicateBrowserProps {
  onInsertPredicate?: (example: string) => void;
}

export function PredicateBrowser({ onInsertPredicate }: PredicateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all predicates
  const { data: predicatesData } = useQuery({
    queryKey: ['predicates'],
    queryFn: async () => {
      const res = await fetch('/api/predicates');
      if (!res.ok) throw new Error('Failed to fetch predicates');
      const data: { predicates: Predicate[] } = await res.json();
      return data;
    }
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['predicate-categories'],
    queryFn: async () => {
      const res = await fetch('/api/predicates/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data: { categories: string[] } = await res.json();
      return data;
    }
  });

  // Filter predicates
  const filteredPredicates = predicatesData?.predicates.filter(pred => {
    const matchesSearch = !searchQuery || 
      pred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pred.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || pred.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Group by source
  const corePredicates = filteredPredicates.filter(p => p.source === 'core');
  const discoveredPredicates = filteredPredicates.filter(p => p.source === 'discovered');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Predicate Browser
        </CardTitle>
        <CardDescription>
          Browse all available predicates with documentation and examples
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search predicates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filter */}
        {categoriesData && categoriesData.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categoriesData.categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* Predicates list */}
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="core">
              <Code className="w-4 h-4 mr-2" />
              Core ({corePredicates.length})
            </TabsTrigger>
            <TabsTrigger value="discovered">
              <Sparkles className="w-4 h-4 mr-2" />
              Discovered ({discoveredPredicates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="core">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {corePredicates.map((pred, i) => (
                  <PredicateCard
                    key={i}
                    predicate={pred}
                    onInsert={onInsertPredicate}
                  />
                ))}
                {corePredicates.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No core predicates found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="discovered">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {discoveredPredicates.map((pred, i) => (
                  <PredicateCard
                    key={i}
                    predicate={pred}
                    onInsert={onInsertPredicate}
                  />
                ))}
                {discoveredPredicates.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No discovered predicates yet. Create some rules to discover custom predicates!
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Individual predicate card
 */
function PredicateCard({ 
  predicate, 
  onInsert 
}: { 
  predicate: Predicate; 
  onInsert?: (example: string) => void;
}) {
  return (
    <Card className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold">
                  {predicate.name}/{predicate.arity}
                </span>
                {predicate.category && (
                  <Badge variant="secondary" className="text-xs">
                    {predicate.category}
                  </Badge>
                )}
                {predicate.confidence && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      predicate.confidence === 'high' ? 'border-green-500 text-green-700' :
                      predicate.confidence === 'medium' ? 'border-yellow-500 text-yellow-700' :
                      'border-slate-500 text-slate-700'
                    }`}
                  >
                    {predicate.confidence}
                  </Badge>
                )}
              </div>
              {predicate.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {predicate.description}
                </p>
              )}
            </div>
            {predicate.usageCount !== undefined && (
              <Badge variant="outline" className="text-xs">
                {predicate.usageCount} uses
              </Badge>
            )}
          </div>

          {/* Arguments */}
          {predicate.args && predicate.args.length > 0 && (
            <div className="text-xs space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Arguments:</div>
              {predicate.args.map((arg, i) => (
                <div key={i} className="ml-2 text-slate-600 dark:text-slate-400">
                  <span className="font-mono">{arg.name}</span>
                  <span className="text-slate-500">: {arg.type}</span>
                  {arg.description && <span className="ml-2">- {arg.description}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Examples */}
          {predicate.examples && predicate.examples.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Examples:
              </div>
              {predicate.examples.slice(0, 3).map((example, i) => (
                <div
                  key={i}
                  onClick={() => onInsert?.(example)}
                  className={`text-xs font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded ${
                    onInsert ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800' : ''
                  }`}
                >
                  {example}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
