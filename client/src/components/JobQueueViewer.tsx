import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  StopCircle,
  BarChart3,
  Image as ImageIcon
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { GenerationJob } from '@shared/schema';

interface JobQueueViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
}

export function JobQueueViewer({ open, onOpenChange, worldId }: JobQueueViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'all' | 'queued' | 'processing' | 'completed' | 'failed'>('all');

  // Fetch all generation jobs
  const { data: allJobs = [], isLoading } = useQuery<GenerationJob[]>({
    queryKey: ['/api/worlds', worldId, 'generation-jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worlds/${worldId}/generation-jobs`);
      return response.json();
    },
    enabled: open,
    refetchInterval: 2000, // Poll every 2 seconds for updates
  });

  // Fetch queue status
  const { data: queueStatus } = useQuery<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  }>({
    queryKey: ['/api/worlds', worldId, 'queue-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worlds/${worldId}/queue-status`);
      return response.json();
    },
    enabled: open,
    refetchInterval: 2000,
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('POST', `/api/generation-jobs/${jobId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', worldId, 'generation-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', worldId, 'queue-status'] });
      toast({
        title: 'Job Cancelled',
        description: 'The generation job has been cancelled',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <StopCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      queued: 'outline',
      processing: 'default',
      completed: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAssetType = (assetType: string) => {
    return assetType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatJobType = (jobType: string) => {
    return jobType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredJobs = selectedTab === 'all'
    ? allJobs
    : allJobs.filter(job => job.status === selectedTab);

  // Sort jobs: processing first, then queued, then others by date
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const statusOrder = { processing: 0, queued: 1, completed: 2, failed: 3, cancelled: 4 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 5;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 5;

    if (aOrder !== bOrder) return aOrder - bOrder;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generation Job Queue
          </DialogTitle>
          <DialogDescription>
            Monitor and manage your visual asset generation jobs
          </DialogDescription>
        </DialogHeader>

        {/* Queue Status Summary */}
        {queueStatus && (
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Queued</CardDescription>
                <CardTitle className="text-2xl text-blue-500">{queueStatus.queued}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Processing</CardDescription>
                <CardTitle className="text-2xl text-yellow-500">{queueStatus.processing}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-2xl text-green-500">{queueStatus.completed}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
                <CardTitle className="text-2xl text-red-500">{queueStatus.failed}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All ({allJobs.length})
            </TabsTrigger>
            <TabsTrigger value="queued">
              Queued ({queueStatus?.queued || 0})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processing ({queueStatus?.processing || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({queueStatus?.completed || 0})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({queueStatus?.failed || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                  <p>No jobs found</p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {sortedJobs.map((job) => (
                    <Card key={job.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {formatJobType(job.jobType)}
                              {job.jobType === 'batch_generation' && (
                                <Badge variant="outline" className="text-xs">
                                  Batch ({job.batchSize})
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {formatAssetType(job.assetType)} · {job.generationProvider}
                            </CardDescription>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Progress */}
                        {(job.status === 'processing' || job.status === 'queued') && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{Math.round(job.progress * 100)}%</span>
                            </div>
                            <Progress value={job.progress * 100} className="h-2" />
                            {job.batchSize > 1 && (
                              <p className="text-xs text-muted-foreground">
                                {job.completedCount || 0} / {job.batchSize} completed
                              </p>
                            )}
                          </div>
                        )}

                        {/* Results */}
                        {job.status === 'completed' && job.generatedAssetIds.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Generated {job.generatedAssetIds.length} asset{job.generatedAssetIds.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {/* Error */}
                        {job.status === 'failed' && job.errorMessage && (
                          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="flex-1">{job.errorMessage}</span>
                          </div>
                        )}

                        {/* Timestamps and actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            {job.startedAt ? (
                              <>Started {new Date(job.startedAt).toLocaleTimeString()}</>
                            ) : (
                              <>Created {new Date(job.createdAt).toLocaleTimeString()}</>
                            )}
                          </div>

                          {job.status === 'queued' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelJobMutation.mutate(job.id)}
                              disabled={cancelJobMutation.isPending}
                            >
                              <StopCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
