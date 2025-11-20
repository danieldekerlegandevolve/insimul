import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Image as ImageIcon, Loader2, CheckCircle2, XCircle, Settings, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { VariantComparisonDialog } from './VariantComparisonDialog';
import { StylePresetSelector } from './StylePresetSelector';
import { applyStylePreset, NEGATIVE_PROMPT_TEMPLATES } from '@shared/style-presets';
import type { VisualAsset, GenerationJob, GenerationProvider } from '@shared/schema';

interface VisualAssetGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'character' | 'business' | 'settlement' | 'world';
  entityId: string;
  entityName?: string;
  assetType: 'character_portrait' | 'building_exterior' | 'map_terrain' | 'map_political' | 'texture_ground' | 'texture_wall';
  onAssetGenerated?: (asset: VisualAsset) => void;
}

export function VisualAssetGeneratorDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  assetType,
  onAssetGenerated
}: VisualAssetGeneratorDialogProps) {
  const [provider, setProvider] = useState<GenerationProvider>('flux');
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  const [variantCount, setVariantCount] = useState<number>(1);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // Additional params for maps and textures
  const [mapType, setMapType] = useState<'terrain' | 'political' | 'region'>('terrain');
  const [textureType, setTextureType] = useState<'ground' | 'wall' | 'material'>('ground');
  const [material, setMaterial] = useState('stone');
  const [style, setStyle] = useState('');

  const [generatedAsset, setGeneratedAsset] = useState<VisualAsset | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<VisualAsset[]>([]);
  const [showVariantComparison, setShowVariantComparison] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const { toast } = useToast();

  // Query available providers
  const { data: providersData } = useQuery<{ providers: GenerationProvider[] }>({
    queryKey: ['/api/assets/providers'],
    enabled: open
  });

  // Poll job status if we have a jobId
  const { data: job } = useQuery<GenerationJob>({
    queryKey: ['/api/generation-jobs', jobId],
    enabled: !!jobId && open,
    refetchInterval: (jobData) => {
      if (!jobData) return 1000;
      if (jobData.status === 'processing' || jobData.status === 'queued') {
        return 1000; // Poll every second
      }
      return false; // Stop polling
    }
  });

  // Generate asset mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      // Apply style preset if selected
      let finalPrompt = useCustomPrompt ? customPrompt : '';
      let finalNegativePrompt = negativePrompt;

      if (selectedStyleId && useCustomPrompt && customPrompt) {
        // Apply style preset to custom prompt
        const { enhancedPrompt, negativePrompt: styleNegative } = applyStylePreset(customPrompt, selectedStyleId);
        finalPrompt = enhancedPrompt;

        // Merge negative prompts: user's manual + style preset + quality template
        const negativePrompts = [
          negativePrompt,
          styleNegative,
          NEGATIVE_PROMPT_TEMPLATES.quality
        ].filter(Boolean);
        finalNegativePrompt = negativePrompts.join(', ');
      } else if (selectedStyleId && !useCustomPrompt) {
        // If using auto-generated prompt, we'll add style modifiers on backend
        // But we can still apply the negative prompts here
        const preset = await import('@shared/style-presets').then(m => m.getStylePreset(selectedStyleId));
        if (preset) {
          const negativePrompts = [
            negativePrompt,
            preset.negativePrompts.join(', '),
            NEGATIVE_PROMPT_TEMPLATES.quality
          ].filter(Boolean);
          finalNegativePrompt = negativePrompts.join(', ');
        }
      } else if (negativePrompt) {
        // Just add quality template to user's negative prompt
        finalNegativePrompt = `${negativePrompt}, ${NEGATIVE_PROMPT_TEMPLATES.quality}`;
      } else {
        // Use default quality negative prompt
        finalNegativePrompt = NEGATIVE_PROMPT_TEMPLATES.default;
      }

      const params = {
        quality,
        width,
        height,
        ...(useCustomPrompt && finalPrompt ? { prompt: finalPrompt } : {}),
        ...(finalNegativePrompt ? { negativePrompt: finalNegativePrompt } : {}),
        ...(selectedStyleId ? { stylePresetId: selectedStyleId } : {})
      };

      let endpoint = '';
      const body: any = { provider, params };

      if (entityType === 'character') {
        // Use variants endpoint if generating multiple
        if (variantCount > 1) {
          endpoint = `/api/characters/${entityId}/generate-portrait-variants`;
          body.variantCount = variantCount;
        } else {
          endpoint = `/api/characters/${entityId}/generate-portrait`;
        }
      } else if (entityType === 'business') {
        endpoint = `/api/businesses/${entityId}/generate-exterior`;
      } else if (entityType === 'settlement') {
        endpoint = `/api/settlements/${entityId}/generate-map`;
        body.mapType = mapType;
      } else if (entityType === 'world') {
        if (assetType.startsWith('texture_')) {
          endpoint = `/api/worlds/${entityId}/generate-texture`;
          body.textureType = textureType;
          body.material = material;
          body.style = style;
        }
      }

      const response = await apiRequest('POST', endpoint, body);
      return response.json();
    },
    onSuccess: (result: any) => {
      // Check if we got multiple variants
      if (result.assets && result.assets.length > 1) {
        setGeneratedVariants(result.assets);
        setShowVariantComparison(true);
        toast({
          title: 'Variants Generated!',
          description: `Generated ${result.assets.length} variants. Select your favorite.`
        });
      } else {
        // Single asset
        const asset = result.assets ? result.assets[0] : result;
        setGeneratedAsset(asset);
        toast({
          title: 'Asset generated successfully!',
          description: `${asset.name} has been created.`
        });
        onAssetGenerated?.(asset);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Watch job status
  useEffect(() => {
    if (job) {
      if (job.status === 'completed' && job.generatedAssetIds.length > 0) {
        // Fetch the generated asset
        const assetId = job.generatedAssetIds[0];
        fetch(`/api/assets/${assetId}`)
          .then(res => res.json())
          .then(asset => {
            setGeneratedAsset(asset);
            onAssetGenerated?.(asset);
            toast({
              title: 'Asset generated successfully!',
              description: `${asset.name} has been created.`
            });
          });
      } else if (job.status === 'failed') {
        toast({
          title: 'Generation failed',
          description: job.errorMessage || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    }
  }, [job, onAssetGenerated, toast]);

  const handleGenerate = () => {
    setGeneratedAsset(null);
    generateMutation.mutate();
  };

  const getAssetTypeName = () => {
    const names: Record<string, string> = {
      character_portrait: 'Character Portrait',
      building_exterior: 'Building Exterior',
      map_terrain: 'Terrain Map',
      map_political: 'Political Map',
      texture_ground: 'Ground Texture',
      texture_wall: 'Wall Texture'
    };
    return names[assetType] || assetType;
  };

  const getSuggestedDimensions = () => {
    if (assetType === 'character_portrait') return { width: 512, height: 512 };
    if (assetType === 'building_exterior') return { width: 768, height: 512 };
    if (assetType.startsWith('map_')) return { width: 1024, height: 768 };
    if (assetType.startsWith('texture_')) return { width: 1024, height: 1024 };
    return { width: 1024, height: 1024 };
  };

  useEffect(() => {
    if (open) {
      const dims = getSuggestedDimensions();
      setWidth(dims.width);
      setHeight(dims.height);
    }
  }, [open, assetType]);

  const isGenerating = generateMutation.isPending || (job && ['processing', 'queued'].includes(job.status));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate {getAssetTypeName()}
          </DialogTitle>
          <DialogDescription>
            {entityName ? `For: ${entityName}` : 'Create visual asset using AI'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="style">
              <Palette className="h-4 w-4 mr-2" />
              Style
            </TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as GenerationProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providersData?.providers.includes('flux' as GenerationProvider) && (
                    <SelectItem value="flux">Flux (Recommended)</SelectItem>
                  )}
                  {providersData?.providers.includes('stable-diffusion' as GenerationProvider) && (
                    <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                  )}
                  {providersData?.providers.includes('dalle' as GenerationProvider) && (
                    <SelectItem value="dalle">DALL-E</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {providersData && providersData.providers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No providers configured. Add API keys to .env file.
                </p>
              )}
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Fast)</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                  <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Variant Count (only for character portraits) */}
            {entityType === 'character' && assetType === 'character_portrait' && (
              <div className="space-y-2">
                <Label>Number of Variants</Label>
                <Select value={variantCount.toString()} onValueChange={(v) => setVariantCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Single Image)</SelectItem>
                    <SelectItem value="2">2 Variants</SelectItem>
                    <SelectItem value="3">3 Variants</SelectItem>
                    <SelectItem value="4">4 Variants</SelectItem>
                  </SelectContent>
                </Select>
                {variantCount > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Generate multiple options to choose from. Compare and select the best variant afterwards.
                  </p>
                )}
              </div>
            )}

            {/* Map type for settlements */}
            {entityType === 'settlement' && (
              <div className="space-y-2">
                <Label>Map Type</Label>
                <Select value={mapType} onValueChange={(v) => setMapType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terrain">Terrain Map</SelectItem>
                    <SelectItem value="political">Political Map</SelectItem>
                    <SelectItem value="region">Regional Overview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Texture options */}
            {entityType === 'world' && assetType.startsWith('texture_') && (
              <>
                <div className="space-y-2">
                  <Label>Texture Type</Label>
                  <Select value={textureType} onValueChange={(v) => setTextureType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ground">Ground/Floor</SelectItem>
                      <SelectItem value="wall">Wall</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Material</Label>
                  <Input
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g., cobblestone, brick, wood"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Style (Optional)</Label>
                  <Input
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g., medieval, modern, weathered"
                  />
                </div>
              </>
            )}

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                  min={256}
                  max={2048}
                  step={256}
                />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  min={256}
                  max={2048}
                  step={256}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Custom Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseCustomPrompt(!useCustomPrompt)}
                >
                  {useCustomPrompt ? 'Use Auto-Generated' : 'Use Custom'}
                </Button>
              </div>
              {useCustomPrompt && (
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom generation prompt..."
                  rows={4}
                />
              )}
              {!useCustomPrompt && (
                <p className="text-sm text-muted-foreground">
                  Prompt will be automatically generated based on entity attributes
                </p>
              )}
            </div>

            {/* Negative Prompt */}
            <div className="space-y-2">
              <Label>Negative Prompt (Optional)</Label>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Things to avoid in the generation..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Or select a style preset in the Style tab for automatic negative prompts
              </p>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <StylePresetSelector
              selectedStyleId={selectedStyleId}
              onStyleSelect={setSelectedStyleId}
            />
          </TabsContent>
        </Tabs>

        {/* Generation Status */}
        {isGenerating && job && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </CardTitle>
              <CardDescription>
                Status: {job.status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={job.progress * 100} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(job.progress * 100)}% complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Generated Asset Preview */}
        {generatedAsset && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Generated Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <img
                  src={`/${generatedAsset.filePath}`}
                  alt={generatedAsset.name}
                  className="w-full rounded-lg border"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{generatedAsset.name}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {generatedAsset.width}x{generatedAsset.height}
                  </Badge>
                  <Badge variant="secondary">
                    {generatedAsset.generationProvider}
                  </Badge>
                  {generatedAsset.tags?.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (providersData?.providers.length === 0)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {variantCount > 1 ? `Generate ${variantCount} Variants` : 'Generate'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Variant Comparison Dialog */}
      {showVariantComparison && (
        <VariantComparisonDialog
          open={showVariantComparison}
          onOpenChange={setShowVariantComparison}
          variants={generatedVariants}
          title="Compare Portrait Variants"
          description="Select your favorite portrait or keep multiple variants"
          onComplete={() => {
            // Refresh assets after variant selection
            if (onAssetGenerated && generatedVariants.length > 0) {
              onAssetGenerated(generatedVariants[0]);
            }
          }}
        />
      )}
    </Dialog>
  );
}
