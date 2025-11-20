import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Save, X, Trash2, BookOpen, Calendar, ChevronRight, ArrowLeft, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Character, VisualAsset } from '@shared/schema';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { VisualAssetGeneratorDialog } from './VisualAssetGeneratorDialog';
import { AssetBrowserDialog } from './AssetBrowserDialog';

interface CharacterEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character | null;
  onCharacterUpdated: () => void;
  onCharacterDeleted: () => void;
  navigationContext?: {
    worldName?: string;
    countryName?: string;
    stateName?: string;
    settlementName?: string;
    onNavigateBack?: () => void;
    onNavigateToCountries?: () => void;
    onNavigateToStates?: () => void;
    onNavigateToSettlements?: () => void;
    onNavigateToCharacters?: () => void;
  };
}

interface Truth {
  id: string;
  title: string;
  content: string;
  entryType: string;
  timestep: number;
  timestepDuration: number | null;
  timeYear: number | null;
  timeSeason: string | null;
  importance: number | null;
  tags: string[] | null;
  source: string | null;
}

export function CharacterEditDialog({
  open,
  onOpenChange,
  character,
  onCharacterUpdated,
  onCharacterDeleted,
  navigationContext
}: CharacterEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssetGenerator, setShowAssetGenerator] = useState(false);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch character truth
  const { data: truths = [] } = useQuery<Truth[]>({
    queryKey: ['/api/characters', character?.id, 'truth'],
    enabled: !!character?.id && open,
  });

  // Fetch character visual assets
  const { data: characterAssets = [] } = useQuery<VisualAsset[]>({
    queryKey: ['/api/assets', 'character', character?.id],
    enabled: !!character?.id && open,
  });

  // Basic info
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [maidenName, setMaidenName] = useState('');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [status, setStatus] = useState('');


  // Load character data when dialog opens
  useEffect(() => {
    if (character) {
      setFirstName(character.firstName);
      setMiddleName(character.middleName || '');
      setLastName(character.lastName);
      setSuffix(character.suffix || '');
      setMaidenName(character.maidenName || '');
      setBirthYear(character.birthYear);
      setGender(character.gender);
      setOccupation(character.occupation || '');
      setCurrentLocation(character.currentLocation || '');
      setIsAlive(character.isAlive ?? true);
      setStatus(character.status || '');
    }
  }, [character]);

  const handleSave = async () => {
    if (!character) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          middleName: middleName || null,
          lastName,
          suffix: suffix || null,
          maidenName: maidenName || null,
          birthYear,
          gender,
          occupation: occupation || null,
          currentLocation: currentLocation || null,
          isAlive,
          status: status || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update character');
      }

      toast({
        title: 'Character Updated',
        description: 'Character information has been saved successfully'
      });

      onCharacterUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update character',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!character) return;

    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete character');
      }

      toast({
        title: 'Character Deleted',
        description: `${character.firstName} ${character.lastName} has been deleted`
      });

      setShowDeleteConfirm(false);
      onCharacterDeleted();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete character',
        variant: 'destructive'
      });
    }
  };

  if (!character) return null;

  // Render breadcrumb if navigation context is provided
  const renderBreadcrumb = () => {
    if (!navigationContext) return null;

    const parts: JSX.Element[] = [];

    // Add back button
    if (navigationContext.onNavigateBack) {
      parts.push(
        <Button
          key="back"
          variant="ghost"
          size="sm"
          onClick={() => {
            onOpenChange(false);
            navigationContext.onNavigateBack?.();
          }}
          className="gap-1 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      );
    }

    // Add breadcrumb trail with clickable items
    if (navigationContext.worldName) {
      parts.push(
        <button
          key="world"
          onClick={() => {
            if (navigationContext.onNavigateToCountries) {
              onOpenChange(false);
              navigationContext.onNavigateToCountries();
            }
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          World
        </button>
      );
    }

    if (navigationContext.countryName) {
      parts.push(<ChevronRight key="sep1" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        <button
          key="country"
          onClick={() => {
            if (navigationContext.onNavigateToStates) {
              onOpenChange(false);
              navigationContext.onNavigateToStates();
            }
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {navigationContext.countryName}
        </button>
      );
    }

    if (navigationContext.stateName) {
      parts.push(<ChevronRight key="sep2" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        <button
          key="state"
          onClick={() => {
            if (navigationContext.onNavigateToSettlements) {
              onOpenChange(false);
              navigationContext.onNavigateToSettlements();
            }
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {navigationContext.stateName}
        </button>
      );
    }

    if (navigationContext.settlementName) {
      parts.push(<ChevronRight key="sep3" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        <button
          key="settlement"
          onClick={() => {
            if (navigationContext.onNavigateToCharacters) {
              onOpenChange(false);
              navigationContext.onNavigateToCharacters();
            }
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {navigationContext.settlementName}
        </button>
      );
    }

    // Add current character (not clickable)
    parts.push(<ChevronRight key="sep4" className="w-4 h-4 text-muted-foreground" />);
    parts.push(
      <span key="character" className="text-sm font-semibold text-primary">
        {character.firstName} {character.lastName}
      </span>
    );

    return (
      <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
        {parts}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {renderBreadcrumb()}
          
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Edit Character
            </DialogTitle>
            <DialogDescription>
              Edit character information and view Truths
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="truth">Truth</TabsTrigger>
              <TabsTrigger value="assets">
                <ImageIcon className="h-4 w-4 mr-2" />
                Visual Assets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Middle name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="Jr., III, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maidenName">Maiden Name</Label>
                  <Input
                    id="maidenName"
                    value={maidenName}
                    onChange={(e) => setMaidenName(e.target.value)}
                    placeholder="Maiden name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthYear">Birth Year</Label>
                  <Input
                    id="birthYear"
                    type="number"
                    value={birthYear || ''}
                    onChange={(e) => setBirthYear(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Birth year"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Occupation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentLocation">Current Location</Label>
                  <Input
                    id="currentLocation"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="Location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="e.g., Active, Retired"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isAlive">Living Status</Label>
                  <Select value={isAlive ? 'alive' : 'deceased'} onValueChange={(v) => setIsAlive(v === 'alive')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alive">Alive</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="truth" className="space-y-4 mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Truths for {character.firstName} {character.lastName}.
                  To add or edit truths, use the Truth tab in the main editor.
                </p>

                <ScrollArea className="h-[400px]">
                  {truths.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No Truths yet</p>
                      <p className="text-sm mt-2">Add character truths in the Truth tab</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {truths
                        .sort((a, b) => b.timestep - a.timestep)
                        .map((entry) => (
                        <Card key={entry.id} className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{entry.title}</h4>
                                <Badge variant="outline" className="text-xs">{entry.entryType}</Badge>
                                {(entry.source === 'imported_ensemble' || entry.source === 'imported_ensemble_history') && (
                                  <Badge variant="secondary" className="text-xs">Imported</Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span className="font-mono">t={entry.timestep}</span>
                                  {entry.timestepDuration && entry.timestepDuration > 1 && (
                                    <span>({entry.timestepDuration} steps)</span>
                                  )}
                                </div>
                                {(entry.timeYear || entry.timeSeason) && (
                                  <>
                                    {entry.timeYear && <span>Year {entry.timeYear}</span>}
                                    {entry.timeSeason && <span className="capitalize">{entry.timeSeason}</span>}
                                  </>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {entry.content}
                              </p>

                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {entry.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Character Visual Assets</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate and manage AI-created visual assets for this character
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssetBrowser(true)}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Browse All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowAssetGenerator(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate New
                    </Button>
                  </div>
                </div>

                {characterAssets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No visual assets yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate a portrait or upload custom character art
                      </p>
                      <Button onClick={() => setShowAssetGenerator(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Character Portrait
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {characterAssets.map(asset => (
                      <Card key={asset.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="relative aspect-square">
                            <img
                              src={`/${asset.filePath}`}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary">
                                {asset.assetType.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium truncate">{asset.name}</p>
                            {asset.generationProvider && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Sparkles className="h-3 w-3" />
                                {asset.generationProvider}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="sm:mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Character
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !firstName.trim() || !lastName.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Generator Dialog */}
      {character && (
        <VisualAssetGeneratorDialog
          open={showAssetGenerator}
          onOpenChange={setShowAssetGenerator}
          entityType="character"
          entityId={character.id}
          entityName={`${character.firstName} ${character.lastName}`}
          assetType="character_portrait"
          onAssetGenerated={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/assets', 'character', character.id] });
          }}
        />
      )}

      {/* Asset Browser Dialog */}
      {character && (
        <AssetBrowserDialog
          open={showAssetBrowser}
          onOpenChange={setShowAssetBrowser}
          entityType="character"
          entityId={character.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{character.firstName} {character.lastName}</strong>?
              This will permanently remove the character and all associated data.
              <p className="mt-2 text-destructive font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Character
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
