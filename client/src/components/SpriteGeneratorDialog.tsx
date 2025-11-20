/**
 * Sprite Generator Dialog
 *
 * UI for generating character sprite sheets with different animations
 * and view angles for 2D games.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Play, CheckCircle2 } from 'lucide-react';

interface SpriteGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName?: string;
}

type GenerationProvider = 'flux' | 'stable-diffusion' | 'dalle' | 'gemini-imagen';
type AnimationType = 'idle' | 'walk' | 'run' | 'jump' | 'attack';
type ViewAngle = 'side' | 'front' | 'back' | 'top-down' | 'isometric';

interface SpriteAsset {
  id: string;
  name: string;
  filePath: string;
  metadata?: {
    animationType: string;
    viewAngle: string;
    frameCount: number;
  };
}

export function SpriteGeneratorDialog({
  open,
  onOpenChange,
  characterId,
  characterName
}: SpriteGeneratorDialogProps) {
  const [provider, setProvider] = useState<GenerationProvider>('flux');
  const [viewAngle, setViewAngle] = useState<ViewAngle>('side');
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>('walk');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Animation configurations
  const animations = [
    { type: 'idle' as AnimationType, frames: 4, description: 'Standing idle with breathing' },
    { type: 'walk' as AnimationType, frames: 8, description: 'Walking cycle' },
    { type: 'run' as AnimationType, frames: 8, description: 'Running animation' },
    { type: 'jump' as AnimationType, frames: 6, description: 'Jump sequence' },
    { type: 'attack' as AnimationType, frames: 6, description: 'Attack motion' },
  ];

  // Fetch existing sprite sheets
  const { data: existingSprites = [] } = useQuery<SpriteAsset[]>({
    queryKey: ['/api/assets/character', characterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/assets/character/${characterId}`);
      const assets = await response.json();
      return assets.filter((a: any) => a.assetType === 'character_sprite');
    },
    enabled: open,
  });

  // Generate single sprite mutation
  const generateSpriteMutation = useMutation({
    mutationFn: async ({ animationType, frameCount }: { animationType: AnimationType; frameCount: number }) => {
      const response = await apiRequest('POST', `/api/characters/${characterId}/generate-sprite`, {
        animationType,
        viewAngle,
        frameCount,
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sprite Generated',
        description: `${data.name} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets/character', characterId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate sprite',
        variant: 'destructive',
      });
    },
  });

  // Generate all sprites mutation
  const generateAllSpritesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/characters/${characterId}/generate-all-sprites`, {
        viewAngle,
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'All Sprites Generated',
        description: `Generated ${data.count} sprite animations`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets/character', characterId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate sprites',
        variant: 'destructive',
      });
    },
  });

  const getSpriteAsset = (animationType: string, viewAngle: string) => {
    return existingSprites.find(
      s => s.metadata?.animationType === animationType && s.metadata?.viewAngle === viewAngle
    );
  };

  const getAnimationIcon = (type: AnimationType) => {
    const icons = {
      idle: '🧍',
      walk: '🚶',
      run: '🏃',
      jump: '🦘',
      attack: '⚔️',
    };
    return icons[type];
  };

  const isGenerating = generateSpriteMutation.isPending || generateAllSpritesMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Generate Character Sprites
          </DialogTitle>
          <DialogDescription>
            {characterName ? `For: ${characterName}` : 'Create sprite animations for 2D games'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Animation</TabsTrigger>
            <TabsTrigger value="batch">All Animations</TabsTrigger>
          </TabsList>

          {/* Single Animation Tab */}
          <TabsContent value="single" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as GenerationProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flux">Flux (Fast)</SelectItem>
                    <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                    <SelectItem value="dalle">DALL-E</SelectItem>
                    <SelectItem value="gemini-imagen">Gemini Imagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Angle */}
              <div className="space-y-2">
                <Label>View Angle</Label>
                <Select value={viewAngle} onValueChange={(v) => setViewAngle(v as ViewAngle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side">Side View (Platform)</SelectItem>
                    <SelectItem value="front">Front View</SelectItem>
                    <SelectItem value="back">Back View</SelectItem>
                    <SelectItem value="top-down">Top-Down</SelectItem>
                    <SelectItem value="isometric">Isometric 3/4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Animation Selection */}
            <div className="space-y-2">
              <Label>Select Animation</Label>
              <div className="grid md:grid-cols-2 gap-3">
                {animations.map((anim) => {
                  const sprite = getSpriteAsset(anim.type, viewAngle);
                  const isSelected = selectedAnimation === anim.type;

                  return (
                    <Card
                      key={anim.type}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedAnimation(anim.type)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{getAnimationIcon(anim.type)}</span>
                            {anim.type.charAt(0).toUpperCase() + anim.type.slice(1)}
                          </span>
                          {sprite && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {anim.frames} frames - {anim.description}
                        </CardDescription>
                      </CardHeader>
                      {sprite && (
                        <CardContent className="pt-0">
                          <img
                            src={`/${sprite.filePath}`}
                            alt={sprite.name}
                            className="w-full border rounded"
                          />
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              onClick={() => {
                const anim = animations.find(a => a.type === selectedAnimation);
                if (anim) {
                  generateSpriteMutation.mutate({
                    animationType: anim.type,
                    frameCount: anim.frames,
                  });
                }
              }}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {selectedAnimation.charAt(0).toUpperCase() + selectedAnimation.slice(1)} Sprite
                </>
              )}
            </Button>
          </TabsContent>

          {/* Batch Generation Tab */}
          <TabsContent value="batch" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as GenerationProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flux">Flux (Fast)</SelectItem>
                    <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                    <SelectItem value="dalle">DALL-E</SelectItem>
                    <SelectItem value="gemini-imagen">Gemini Imagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Angle */}
              <div className="space-y-2">
                <Label>View Angle</Label>
                <Select value={viewAngle} onValueChange={(v) => setViewAngle(v as ViewAngle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side">Side View (Platform)</SelectItem>
                    <SelectItem value="front">Front View</SelectItem>
                    <SelectItem value="back">Back View</SelectItem>
                    <SelectItem value="top-down">Top-Down</SelectItem>
                    <SelectItem value="isometric">Isometric 3/4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generate All Animations</CardTitle>
                <CardDescription>
                  This will generate 5 sprite sheets: idle, walk, run, jump, and attack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {animations.map((anim) => {
                    const sprite = getSpriteAsset(anim.type, viewAngle);
                    return (
                      <div key={anim.type} className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getAnimationIcon(anim.type)}</span>
                          <span className="font-medium">
                            {anim.type.charAt(0).toUpperCase() + anim.type.slice(1)}
                          </span>
                          <Badge variant="outline">{anim.frames} frames</Badge>
                        </div>
                        {sprite ? (
                          <Badge variant="default">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Generated
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="w-full"
                  onClick={() => generateAllSpritesMutation.mutate()}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating All Sprites...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All 5 Animations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
