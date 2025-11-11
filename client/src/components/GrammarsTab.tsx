import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  PlayCircle, 
  FileText,
  Tag,
  Calendar,
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GrammarEditor } from './GrammarEditor';
import { GrammarTestConsole } from './GrammarTestConsole';
import { GenerateGrammarDialog } from './GenerateGrammarDialog';
import { NamePatternEditor } from './NamePatternEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Grammar {
  id: string;
  worldId: string;
  name: string;
  description: string | null;
  grammar: Record<string, string | string[]>;
  tags: string[];
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface GrammarsTabProps {
  worldId: string;
}

export function GrammarsTab({ worldId }: GrammarsTabProps) {
  const [grammars, setGrammars] = useState<Grammar[]>([]);
  const [filteredGrammars, setFilteredGrammars] = useState<Grammar[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrammar, setSelectedGrammar] = useState<Grammar | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingName, setIsCreatingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [grammarToDelete, setGrammarToDelete] = useState<Grammar | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGrammars();
  }, [worldId]);

  useEffect(() => {
    filterGrammars();
  }, [searchQuery, grammars]);

  const loadGrammars = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/worlds/${worldId}/grammars`);
      if (!response.ok) throw new Error('Failed to fetch grammars');
      
      const data = await response.json();
      setGrammars(data);
      setFilteredGrammars(data);
    } catch (error) {
      console.error('Error loading grammars:', error);
      toast({
        title: 'Error',
        description: 'Failed to load grammars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterGrammars = () => {
    if (!searchQuery.trim()) {
      setFilteredGrammars(grammars);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = grammars.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query) ||
        g.tags.some((tag) => tag.toLowerCase().includes(query))
    );
    setFilteredGrammars(filtered);
  };

  const handleCreateGrammar = () => {
    setSelectedGrammar(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleCreateNameGrammar = () => {
    setSelectedGrammar(null);
    setIsCreatingName(true);
  };

  const handleEditGrammar = (grammar: Grammar) => {
    setSelectedGrammar(grammar);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleTestGrammar = (grammar: Grammar) => {
    setSelectedGrammar(grammar);
    setIsTesting(true);
  };

  const handleDeleteGrammar = (grammar: Grammar) => {
    setGrammarToDelete(grammar);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!grammarToDelete) return;

    try {
      const response = await fetch(`/api/grammars/${grammarToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete grammar');

      toast({
        title: 'Grammar deleted',
        description: `"${grammarToDelete.name}" has been deleted.`,
      });

      await loadGrammars();
      setDeleteDialogOpen(false);
      setGrammarToDelete(null);
    } catch (error) {
      console.error('Error deleting grammar:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete grammar',
        variant: 'destructive',
      });
    }
  };

  const handleSaveGrammar = async (grammarData: Partial<Grammar>) => {
    try {
      const url = isCreating ? '/api/grammars' : `/api/grammars/${selectedGrammar?.id}`;
      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...grammarData,
          worldId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save grammar');

      toast({
        title: isCreating ? 'Grammar created' : 'Grammar updated',
        description: `"${grammarData.name}" has been ${isCreating ? 'created' : 'updated'}.`,
      });

      await loadGrammars();
      setIsEditing(false);
      setSelectedGrammar(null);
    } catch (error) {
      console.error('Error saving grammar:', error);
      toast({
        title: 'Error',
        description: 'Failed to save grammar',
        variant: 'destructive',
      });
    }
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
    setSelectedGrammar(null);
  };

  const handleCloseTest = () => {
    setIsTesting(false);
    setSelectedGrammar(null);
  };

  const handleCloseNameEditor = () => {
    setIsCreatingName(false);
    setSelectedGrammar(null);
  };

  if (isEditing) {
    return (
      <GrammarEditor
        grammar={selectedGrammar}
        worldId={worldId}
        isCreating={isCreating}
        onSave={handleSaveGrammar}
        onCancel={handleCloseEditor}
      />
    );
  }

  if (isTesting && selectedGrammar) {
    return (
      <GrammarTestConsole
        grammar={selectedGrammar}
        onClose={handleCloseTest}
      />
    );
  }

  if (isCreatingName) {
    return (
      <NamePatternEditor
        worldId={worldId}
        onSave={handleSaveGrammar}
        onCancel={handleCloseNameEditor}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tracery Grammars</h2>
          <p className="text-muted-foreground">
            Create and manage procedural text generation templates
          </p>
        </div>
        <div className="flex gap-2">
          <GenerateGrammarDialog 
            worldId={worldId}
            onGenerated={(generated) => {
              // Create the grammar with generated data
              handleSaveGrammar({
                name: generated.name,
                description: generated.description,
                grammar: generated.grammar,
                tags: generated.tags,
                isActive: true,
              });
            }}
          />
          <Button onClick={handleCreateNameGrammar} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Name Pattern
          </Button>
          <Button onClick={handleCreateGrammar} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Manual
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search grammars by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grammars</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grammars.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grammars.filter((g) => g.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(grammars.flatMap((g) => g.tags)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grammars List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading grammars...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredGrammars.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No grammars found' : 'No grammars yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Create your first grammar to start generating procedural text'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateGrammar} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Grammar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGrammars.map((grammar) => (
            <Card key={grammar.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {grammar.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {grammar.description || 'No description'}
                    </CardDescription>
                  </div>
                  {!grammar.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Tags */}
                {grammar.tags && grammar.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {grammar.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Symbol count */}
                <div className="text-sm text-muted-foreground">
                  {Object.keys(grammar.grammar).length} symbols
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestGrammar(grammar)}
                    className="flex-1 gap-2"
                  >
                    <PlayCircle className="h-3 w-3" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditGrammar(grammar)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteGrammar(grammar)}
                    className="gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grammar</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{grammarToDelete?.name}"? This action cannot be
              undone. Any rules using this grammar may stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
