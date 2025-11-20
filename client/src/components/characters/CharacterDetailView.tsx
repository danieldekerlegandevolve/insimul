import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Heart, Brain, Activity, Briefcase, Users, ChevronRight, MessageCircle, Image, Sparkles, Play, History } from 'lucide-react';
import { VisualAssetGeneratorDialog } from '@/components/VisualAssetGeneratorDialog';
import { SpriteGeneratorDialog } from '@/components/SpriteGeneratorDialog';
import { GenerationHistoryViewer } from '@/components/GenerationHistoryViewer';
import type { Character, VisualAsset } from '@shared/schema';

interface CharacterDetailViewProps {
  character: Character;
  allCharacters: Character[];
  onEditCharacter: (character: Character) => void;
  onChatWithCharacter: (character: Character) => void;
  onViewCharacter: (character: Character) => void;
}

export function CharacterDetailView({
  character,
  allCharacters,
  onEditCharacter,
  onChatWithCharacter,
  onViewCharacter
}: CharacterDetailViewProps) {
  const [showVisualGenerator, setShowVisualGenerator] = useState(false);
  const [showSpriteGenerator, setShowSpriteGenerator] = useState(false);
  const [showGenerationHistory, setShowGenerationHistory] = useState(false);
  const [historyAssetType, setHistoryAssetType] = useState<string | undefined>();

  // Fetch visual assets for this character
  const { data: visualAssets = [] } = useQuery<any[]>({
    queryKey: ['/api/assets/character', character.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/assets/character/${character.id}`);
      return response.json();
    },
  });

  const portrait = visualAssets.find(a => a.assetType === 'character_portrait');
  const fullBody = visualAssets.find(a => a.assetType === 'character_full_body');
  const sprites = visualAssets.filter(a => a.assetType === 'character_sprite');

  const getFullName = (char: Character) => {
    const parts = [
      char.firstName,
      char.middleName,
      char.lastName,
      char.suffix
    ].filter(Boolean);
    return parts.join(' ');
  };

  const getAge = (char: Character) => {
    if (!char.birthYear) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - char.birthYear;
  };

  const getCharacterById = (id: string) => {
    return allCharacters.find(c => c.id === id);
  };

  const handleRegenerateFromHistory = (asset: VisualAsset) => {
    // Open the generator dialog with settings from the historical asset
    // This would pass the generation params to the generator
    setShowVisualGenerator(true);
    // Note: The VisualAssetGeneratorDialog would need to accept initialParams
    // For now, this just opens the dialog
  };

  const handleViewHistory = (assetType?: string) => {
    setHistoryAssetType(assetType);
    setShowGenerationHistory(true);
  };

  return (
    <div className="space-y-6">
      {/* Character Info Card with Portrait */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Portrait Display */}
              <div className="flex-shrink-0">
                {portrait ? (
                  <img
                    src={`/${portrait.filePath}`}
                    alt={getFullName(character)}
                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
                    <User className="w-12 h-12 text-primary/50" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <CardTitle className="text-2xl">{getFullName(character)}</CardTitle>
                <CardDescription className="mt-1">
                  {getAge(character) && `Age ${getAge(character)} • `}
                  {character.gender && `${character.gender.charAt(0).toUpperCase() + character.gender.slice(1)}`}
                </CardDescription>

                {/* Visual Asset Quick Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVisualGenerator(true)}
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    {portrait ? 'Regenerate' : 'Generate'} Portrait
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpriteGenerator(true)}
                  >
                    <Play className="w-3 h-3 mr-2" />
                    {sprites.length > 0 ? 'View' : 'Generate'} Sprites
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onChatWithCharacter(character)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Talk
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEditCharacter(character)}>
                Edit Character
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Occupation</span>
              <p className="font-semibold">{character.occupation || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Location</span>
              <p className="font-semibold">{character.currentLocation || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Gender</span>
              <p className="font-semibold">{character.gender || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Age</span>
              <p className="font-semibold">{getAge(character) || 'Unknown'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Assets Section */}
      {(portrait || fullBody || sprites.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  Visual Assets
                </CardTitle>
                <CardDescription>AI-generated character visuals</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewHistory()}
              >
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="portrait" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="portrait">Portrait</TabsTrigger>
                <TabsTrigger value="full-body">Full Body</TabsTrigger>
                <TabsTrigger value="sprites">Sprites ({sprites.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="portrait" className="mt-4">
                {portrait ? (
                  <div className="space-y-3">
                    <img
                      src={`/${portrait.filePath}`}
                      alt={portrait.name}
                      className="w-full max-w-md mx-auto rounded-lg border"
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      Generated with {portrait.generationProvider}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No portrait generated yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowVisualGenerator(true)}
                    >
                      <Sparkles className="w-3 h-3 mr-2" />
                      Generate Portrait
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="full-body" className="mt-4">
                {fullBody ? (
                  <div className="space-y-3">
                    <img
                      src={`/${fullBody.filePath}`}
                      alt={fullBody.name}
                      className="w-full max-w-md mx-auto rounded-lg border"
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      Generated with {fullBody.generationProvider}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No full-body image generated yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sprites" className="mt-4">
                {sprites.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {sprites.map((sprite) => (
                      <Card key={sprite.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{sprite.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {sprite.metadata?.animationType} • {sprite.metadata?.viewAngle} • {sprite.metadata?.frameCount} frames
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <img
                            src={`/${sprite.filePath}`}
                            alt={sprite.name}
                            className="w-full border rounded"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No sprite sheets generated yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowSpriteGenerator(true)}
                    >
                      <Play className="w-3 h-3 mr-2" />
                      Generate Sprites
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Personality & Traits */}
      {character.personality && Object.keys(character.personality).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Personality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(character.personality).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                  <p className="font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Physical Traits */}
      {character.physicalTraits && Object.keys(character.physicalTraits).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Physical Traits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(character.physicalTraits).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                  <p className="font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {character.skills && Object.keys(character.skills).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(character.skills).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{key}</span>
                  <span className="px-2 py-1 bg-primary/10 rounded text-primary font-medium text-sm">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relationships */}
      {character.relationships && Object.keys(character.relationships).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Relationships ({Object.keys(character.relationships).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(character.relationships).map(([characterId, relationship]: [string, any]) => {
                const relatedCharacter = getCharacterById(characterId);
                return (
                  <Card
                    key={characterId}
                    className="cursor-pointer hover:border-primary transition-all"
                    onClick={() => {
                      if (relatedCharacter) onViewCharacter(relatedCharacter);
                    }}
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {relatedCharacter ? getFullName(relatedCharacter) : 'Unknown Character'}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {typeof relationship === 'string' ? relationship : relationship?.type || 'Unknown relationship'}
                          </CardDescription>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family */}
      {((character.parentIds && character.parentIds.length > 0) ||
        (character.childIds && character.childIds.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {character.parentIds && character.parentIds.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Parents</h4>
                <div className="space-y-2">
                  {character.parentIds.map(parentId => {
                    const parent = getCharacterById(parentId);
                    return parent ? (
                      <Card
                        key={parentId}
                        className="cursor-pointer hover:border-primary transition-all"
                        onClick={() => onViewCharacter(parent)}
                      >
                        <CardHeader className="py-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{getFullName(parent)}</CardTitle>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardHeader>
                      </Card>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {character.childIds && character.childIds.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Children</h4>
                <div className="space-y-2">
                  {character.childIds.map(childId => {
                    const child = getCharacterById(childId);
                    return child ? (
                      <Card
                        key={childId}
                        className="cursor-pointer hover:border-primary transition-all"
                        onClick={() => onViewCharacter(child)}
                      >
                        <CardHeader className="py-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{getFullName(child)}</CardTitle>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardHeader>
                      </Card>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Visual Generation Dialogs */}
      {showVisualGenerator && (
        <VisualAssetGeneratorDialog
          open={showVisualGenerator}
          onOpenChange={setShowVisualGenerator}
          entityType="character"
          entityId={character.id}
          entityName={getFullName(character)}
        />
      )}

      {showSpriteGenerator && (
        <SpriteGeneratorDialog
          open={showSpriteGenerator}
          onOpenChange={setShowSpriteGenerator}
          characterId={character.id}
          characterName={getFullName(character)}
        />
      )}

      {showGenerationHistory && (
        <GenerationHistoryViewer
          open={showGenerationHistory}
          onOpenChange={setShowGenerationHistory}
          entityType="character"
          entityId={character.id}
          entityName={getFullName(character)}
          assetType={historyAssetType}
          onRegenerateFromHistory={handleRegenerateFromHistory}
        />
      )}
    </div>
  );
}
