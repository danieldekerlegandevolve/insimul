/**
 * Artifact Gallery Dialog
 *
 * Displays all artifacts in a world with their images.
 * Allows users to generate images for individual artifacts.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ArtifactGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  worldName: string;
}

interface Artifact {
  id: string;
  type: string;
  name: string;
  description: string;
  createdAt: number;
  emotionalValue: number;
  condition: string;
  currentOwner: string | null;
}

type GenerationProvider = 'flux' | 'stable-diffusion' | 'dalle' | 'gemini-imagen';

export function ArtifactGalleryDialog({ open, onOpenChange, worldId, worldName }: ArtifactGalleryDialogProps) {
  const [provider, setProvider] = useState<GenerationProvider>('flux');
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch artifacts
  const { data: artifacts = [], isLoading: loadingArtifacts } = useQuery<Artifact[]>({
    queryKey: ['/api/worlds', worldId, 'artifacts'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worlds/${worldId}/artifacts`);
      return response.json();
    },
    enabled: open,
  });

  // Fetch visual assets
  const { data: visualAssets = [] } = useQuery<any[]>({
    queryKey: ['/api/worlds', worldId, 'assets'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worlds/${worldId}/assets`);
      return response.json();
    },
    enabled: open,
  });

  // Generate single artifact image mutation
  const generateImageMutation = useMutation({
    mutationFn: async (artifactId: string) => {
      const response = await apiRequest('POST', `/api/worlds/${worldId}/artifacts/${artifactId}/generate-image`, {
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Image Generated',
        description: `Artifact image has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', worldId, 'assets'] });
      setSelectedArtifact(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate artifact image',
        variant: 'destructive',
      });
    },
  });

  const getArtifactImage = (artifactId: string) => {
    return visualAssets.find(asset =>
      asset.assetType === 'artifact_image' &&
      asset.metadata?.artifactId === artifactId
    );
  };

  const getArtifactTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      photograph: '📸',
      gravestone: '🪦',
      wedding_ring: '💍',
      letter: '✉️',
      heirloom: '👑',
      diary: '📖',
      document: '📜',
      painting: '🖼️',
      book: '📚',
    };
    return icons[type] || '📦';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Artifact Gallery
          </DialogTitle>
          <DialogDescription>
            View and generate images for artifacts in {worldName}
          </DialogDescription>
        </DialogHeader>

        {/* Provider Selection */}
        <div className="flex items-center gap-4 pb-4">
          <span className="text-sm text-muted-foreground">AI Provider:</span>
          <Select value={provider} onValueChange={(v) => setProvider(v as GenerationProvider)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flux">Flux</SelectItem>
              <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
              <SelectItem value="dalle">DALL-E</SelectItem>
              <SelectItem value="gemini-imagen">Gemini Imagen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {loadingArtifacts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : artifacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No artifacts found in this world</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artifacts.map((artifact) => {
                const image = getArtifactImage(artifact.id);
                const isGenerating = generateImageMutation.isPending && selectedArtifact === artifact.id;

                return (
                  <Card key={artifact.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-lg">{getArtifactTypeIcon(artifact.type)}</span>
                        {artifact.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {artifact.type.replace(/_/g, ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Image Display */}
                      <div className="relative aspect-square w-full bg-muted rounded-md overflow-hidden">
                        {image ? (
                          <img
                            src={`/${image.filePath}`}
                            alt={artifact.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {artifact.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {artifact.condition}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Sentimental: {Math.round(artifact.emotionalValue * 100)}%
                        </Badge>
                      </div>

                      {/* Generate Button */}
                      {!image && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => {
                            setSelectedArtifact(artifact.id);
                            generateImageMutation.mutate(artifact.id);
                          }}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-3 w-3" />
                              Generate Image
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
