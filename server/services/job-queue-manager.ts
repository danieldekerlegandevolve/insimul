/**
 * Job Queue Manager Service
 *
 * Handles background processing of generation jobs with queue management,
 * concurrent processing, and automatic retries.
 */

import { storage } from '../db/storage.js';
import { visualAssetGenerator } from './visual-asset-generator.js';
import type { GenerationJob, GenerationProvider } from '@shared/schema';

export class JobQueueManager {
  private isProcessing: boolean = false;
  private processingJobIds: Set<string> = new Set();
  private maxConcurrentJobs: number = 3; // Process up to 3 jobs simultaneously
  private pollInterval: number = 2000; // Check for new jobs every 2 seconds
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(maxConcurrentJobs: number = 3) {
    this.maxConcurrentJobs = maxConcurrentJobs;
  }

  /**
   * Start the queue processor
   */
  start() {
    if (this.isProcessing) {
      console.log('Job queue manager already running');
      return;
    }

    console.log(`Starting job queue manager (max ${this.maxConcurrentJobs} concurrent jobs)`);
    this.isProcessing = true;
    this.pollForJobs();
  }

  /**
   * Stop the queue processor
   */
  stop() {
    console.log('Stopping job queue manager');
    this.isProcessing = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Poll for queued jobs and process them
   */
  private async pollForJobs() {
    if (!this.isProcessing) return;

    try {
      // Check if we have capacity to process more jobs
      if (this.processingJobIds.size < this.maxConcurrentJobs) {
        // Get all worlds to check for queued jobs
        const worlds = await storage.getWorlds();

        for (const world of worlds) {
          if (this.processingJobIds.size >= this.maxConcurrentJobs) break;

          // Get queued jobs for this world
          const queuedJobs = await storage.getGenerationJobsByStatus(world.id, 'queued');

          for (const job of queuedJobs) {
            if (this.processingJobIds.size >= this.maxConcurrentJobs) break;

            // Process this job in the background
            this.processJob(job).catch(error => {
              console.error(`Error processing job ${job.id}:`, error);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error polling for jobs:', error);
    }

    // Schedule next poll
    this.pollTimer = setTimeout(() => this.pollForJobs(), this.pollInterval);
  }

  /**
   * Process a single generation job
   */
  private async processJob(job: GenerationJob): Promise<void> {
    // Mark as processing
    this.processingJobIds.add(job.id);

    try {
      console.log(`Processing job ${job.id} (${job.jobType})`);

      // Update job status to processing
      await storage.updateGenerationJob(job.id, {
        status: 'processing',
        startedAt: new Date(),
      });

      // Route to appropriate generator based on asset type and job type
      let assetIds: string[] = [];

      if (job.jobType === 'batch_generation') {
        assetIds = await this.processBatchJob(job);
      } else {
        // Single asset generation
        assetIds = await this.processSingleAssetJob(job);
      }

      // Mark job as completed
      await storage.updateGenerationJob(job.id, {
        status: 'completed',
        progress: 1.0,
        completedCount: assetIds.length,
        generatedAssetIds: assetIds,
        completedAt: new Date(),
      });

      console.log(`Job ${job.id} completed successfully (${assetIds.length} assets)`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      // Mark job as failed
      await storage.updateGenerationJob(job.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });
    } finally {
      // Remove from processing set
      this.processingJobIds.delete(job.id);
    }
  }

  /**
   * Process a single asset generation job
   */
  private async processSingleAssetJob(job: GenerationJob): Promise<string[]> {
    const provider = job.generationProvider as GenerationProvider;
    const params = job.generationParams;

    switch (job.assetType) {
      case 'character_portrait':
        if (job.targetEntityId) {
          const assetId = await visualAssetGenerator.generateCharacterPortrait(
            job.targetEntityId,
            provider,
            params
          );
          return [assetId];
        }
        break;

      case 'character_full_body':
        if (job.targetEntityId) {
          const assetId = await visualAssetGenerator.generateCharacterFullBody(
            job.targetEntityId,
            provider,
            params
          );
          return [assetId];
        }
        break;

      case 'building_exterior':
        if (job.targetEntityId) {
          const assetId = await visualAssetGenerator.generateBuildingExterior(
            job.targetEntityId,
            provider,
            params
          );
          return [assetId];
        }
        break;

      case 'map_terrain':
      case 'map_political':
        if (job.targetEntityId) {
          const mapType = job.assetType === 'map_terrain' ? 'terrain' : 'political';
          const assetId = await visualAssetGenerator.generateSettlementMap(
            job.targetEntityId,
            provider,
            mapType,
            params
          );
          return [assetId];
        }
        break;

      default:
        throw new Error(`Unsupported asset type: ${job.assetType}`);
    }

    return [];
  }

  /**
   * Process a batch generation job (multiple assets)
   */
  private async processBatchJob(job: GenerationJob): Promise<string[]> {
    const provider = job.generationProvider as GenerationProvider;
    const params = job.generationParams;
    const assetIds: string[] = [];

    // Get target entities based on job configuration
    const targetEntityIds = params.targetEntityIds as string[] | undefined;
    if (!targetEntityIds || targetEntityIds.length === 0) {
      throw new Error('Batch job requires targetEntityIds in params');
    }

    const totalCount = targetEntityIds.length;

    // Process each entity
    for (let i = 0; i < targetEntityIds.length; i++) {
      const entityId = targetEntityIds[i];

      try {
        let assetId: string | undefined;

        switch (job.assetType) {
          case 'character_portrait':
            assetId = await visualAssetGenerator.generateCharacterPortrait(
              entityId,
              provider,
              params
            );
            break;

          case 'building_exterior':
            assetId = await visualAssetGenerator.generateBuildingExterior(
              entityId,
              provider,
              params
            );
            break;

          default:
            console.warn(`Unsupported batch asset type: ${job.assetType}`);
            continue;
        }

        if (assetId) {
          assetIds.push(assetId);
        }
      } catch (error) {
        console.error(`Failed to generate asset for entity ${entityId}:`, error);
        // Continue with other entities even if one fails
      }

      // Update progress
      await storage.updateGenerationJob(job.id, {
        progress: (i + 1) / totalCount,
        completedCount: assetIds.length,
        generatedAssetIds: assetIds,
      });
    }

    return assetIds;
  }

  /**
   * Get current queue status
   */
  async getQueueStatus(worldId?: string): Promise<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const statuses = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    if (worldId) {
      const jobs = await storage.getGenerationJobsByWorld(worldId);
      for (const job of jobs) {
        if (job.status === 'queued') statuses.queued++;
        else if (job.status === 'processing') statuses.processing++;
        else if (job.status === 'completed') statuses.completed++;
        else if (job.status === 'failed') statuses.failed++;
      }
    }

    return statuses;
  }

  /**
   * Cancel a queued job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await storage.getGenerationJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'processing') {
      throw new Error('Cannot cancel a job that is currently processing');
    }

    if (job.status !== 'queued') {
      throw new Error('Can only cancel queued jobs');
    }

    await storage.updateGenerationJob(jobId, {
      status: 'cancelled',
      completedAt: new Date(),
    });
  }
}

// Export singleton instance
export const jobQueueManager = new JobQueueManager(3);
