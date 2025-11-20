/**
 * Batch Generation Dialog
 *
 * Provides UI for triggering batch visual asset generation for worlds.
 * Allows users to generate portraits, building exteriors, and maps in bulk.
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
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Image, MapPin, Building2, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface BatchGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  worldName: string;
}

type BatchJobType = 'portraits' | 'buildings' | 'maps';
type GenerationProvider = 'flux' | 'stable-diffusion' | 'dalle' | 'gemini-imagen';

interface GenerationJob {
  id: string;
  worldId: string;
  jobType: string;
  assetType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  batchSize: number;
  completedCount: number;
  generatedAssetIds: string[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function BatchGenerationDialog({ open, onOpenChange, worldId, worldName }: BatchGenerationDialogProps) {
  const [provider, setProvider] = useState<GenerationProvider>('flux');
  const [activeJobs, setActiveJobs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch world stats
  const { data: worldStats } = useQuery<{
    characters: number;
    businesses: number;
    settlements: number;
    artifacts: number;
  }>({
    queryKey: ['/api/worlds', worldId, 'stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worlds/${worldId}/stats`);
      return response.json();
    },
    enabled: open,
  });

  // Fetch existing assets
  const { data: existingAssets = [] } = useQuery<any[]>({
    queryKey: ['/api/worlds', worldId, 'assets'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worlds/${worldId}/assets`);
      return response.json();
    },
    enabled: open,
  });

  // Fetch active generation jobs
  const { data: generationJobs = [], refetch: refetchJobs } = useQuery<GenerationJob[]>({
    queryKey: ['/api/worlds', worldId, 'generation-jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worlds/${worldId}/generation-jobs?status=processing`);
      return response.json();
    },
    enabled: open,
    refetchInterval: (query) => {
      const jobs = query.state.data || [];
      return jobs.some(j => j.status === 'processing') ? 2000 : false;
    },
  });

  // Batch portrait generation mutation
  const generatePortraitsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/worlds/${worldId}/batch-generate-portraits`, {
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Portrait Generation Started',
        description: `Generating portraits for ${worldStats?.characters || 0} characters`,
      });
      setActiveJobs(prev => new Set(prev).add(data.jobId));
      refetchJobs();
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start portrait generation',
        variant: 'destructive',
      });
    },
  });

  // Batch building generation mutation
  const generateBuildingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/worlds/${worldId}/batch-generate-buildings`, {
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Building Generation Started',
        description: `Generating exteriors for ${worldStats?.businesses || 0} buildings`,
      });
      setActiveJobs(prev => new Set(prev).add(data.jobId));
      refetchJobs();
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start building generation',
        variant: 'destructive',
      });
    },
  });

  // Batch map generation mutation
  const generateMapsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/worlds/${worldId}/batch-generate-maps`, {
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Map Generation Started',
        description: `Generating maps for ${worldStats?.settlements || 0} settlements`,
      });
      setActiveJobs(prev => new Set(prev).add(data.jobId));
      refetchJobs();
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start map generation',
        variant: 'destructive',
      });
    },
  });

  // Batch artifact generation mutation
  const generateArtifactsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/worlds/${worldId}/batch-generate-artifacts`, {
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Artifact Generation Started',
        description: `Generating images for ${worldStats?.artifacts || 0} artifacts`,
      });
      setActiveJobs(prev => new Set(prev).add(data.jobId));
      refetchJobs();
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start artifact generation',
        variant: 'destructive',
      });
    },
  });

  const getAssetCount = (assetType: string): number => {
    return existingAssets.filter(a => a.assetType.includes(assetType)).length;
  };

  const portraitCount = getAssetCount('character_portrait');
  const buildingCount = getAssetCount('building_exterior');
  const mapCount = getAssetCount('map_');
  const artifactCount = getAssetCount('artifact_image');

  const getJobStatusIcon = (status: GenerationJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Batch Visual Asset Generation
          </DialogTitle>
          <DialogDescription>
            Generate visual assets in bulk for {worldName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generation Provider</CardTitle>
              <CardDescription>Select the AI provider for image generation</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={provider} onValueChange={(v) => setProvider(v as GenerationProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flux">Flux (Fast, High Quality)</SelectItem>
                  <SelectItem value="stable-diffusion">Stable Diffusion (Customizable)</SelectItem>
                  <SelectItem value="dalle">DALL-E (Creative)</SelectItem>
                  <SelectItem value="gemini-imagen">Gemini Imagen (Realistic)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Batch Generation Options */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Character Portraits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Character Portraits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Characters</span>
                    <Badge variant="secondary">{worldStats?.characters || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Existing Portraits</span>
                    <Badge variant="outline">{portraitCount}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Missing</span>
                    <Badge variant="destructive">
                      {Math.max(0, (worldStats?.characters || 0) - portraitCount)}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => generatePortraitsMutation.mutate()}
                  disabled={generatePortraitsMutation.isPending || (worldStats?.characters || 0) === 0}
                >
                  {generatePortraitsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Portraits
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Building Exteriors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Building Exteriors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Buildings</span>
                    <Badge variant="secondary">{worldStats?.businesses || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Existing Exteriors</span>
                    <Badge variant="outline">{buildingCount}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Missing</span>
                    <Badge variant="destructive">
                      {Math.max(0, (worldStats?.businesses || 0) - buildingCount)}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => generateBuildingsMutation.mutate()}
                  disabled={generateBuildingsMutation.isPending || (worldStats?.businesses || 0) === 0}
                >
                  {generateBuildingsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Exteriors
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Settlement Maps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Settlement Maps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Settlements</span>
                    <Badge variant="secondary">{worldStats?.settlements || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Existing Maps</span>
                    <Badge variant="outline">{mapCount}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Missing</span>
                    <Badge variant="destructive">
                      {Math.max(0, (worldStats?.settlements || 1) * 3 - mapCount)}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => generateMapsMutation.mutate()}
                  disabled={generateMapsMutation.isPending || (worldStats?.settlements || 0) === 0}
                >
                  {generateMapsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Maps
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Artifact Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Artifact Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Artifacts</span>
                    <Badge variant="secondary">{worldStats?.artifacts || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Existing Images</span>
                    <Badge variant="outline">{artifactCount}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Missing</span>
                    <Badge variant="destructive">
                      {Math.max(0, (worldStats?.artifacts || 0) - artifactCount)}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => generateArtifactsMutation.mutate()}
                  disabled={generateArtifactsMutation.isPending || (worldStats?.artifacts || 0) === 0}
                >
                  {generateArtifactsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Images
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Generation Jobs */}
          {generationJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Generation Jobs</CardTitle>
                <CardDescription>Monitor ongoing asset generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generationJobs.map((job) => (
                  <div key={job.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getJobStatusIcon(job.status)}
                        <span className="font-medium">
                          {job.assetType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>

                    <Progress value={job.progress * 100} className="h-2" />

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {job.completedCount} / {job.batchSize} assets generated
                      </span>
                      <span>{Math.round(job.progress * 100)}%</span>
                    </div>

                    {job.errorMessage && (
                      <p className="text-sm text-red-500">{job.errorMessage}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Batch generation will create visual assets for all entities in your world.
                This process may take several minutes depending on the number of assets to generate.
                You can monitor progress in real-time and continue working while generation runs in the background.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
