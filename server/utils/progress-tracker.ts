/**
 * Progress Tracker for long-running generation tasks
 * Stores progress in memory for real-time updates
 */

interface ProgressUpdate {
  taskId: string;
  stage: string;
  message: string;
  progress: number; // 0-100
  details?: Record<string, any>;
  completed: boolean;
  error?: string;
  timestamp: Date;
}

class ProgressTracker {
  private tasks: Map<string, ProgressUpdate[]> = new Map();
  
  /**
   * Start tracking a new task
   */
  startTask(taskId: string): void {
    this.tasks.set(taskId, [{
      taskId,
      stage: 'initialized',
      message: 'Starting generation...',
      progress: 0,
      completed: false,
      timestamp: new Date()
    }]);
    
    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      this.tasks.delete(taskId);
    }, 10 * 60 * 1000);
  }
  
  /**
   * Update progress for a task
   */
  updateProgress(
    taskId: string,
    stage: string,
    message: string,
    progress: number,
    details?: Record<string, any>
  ): void {
    const updates = this.tasks.get(taskId) || [];
    updates.push({
      taskId,
      stage,
      message,
      progress: Math.min(100, Math.max(0, progress)),
      details,
      completed: false,
      timestamp: new Date()
    });
    this.tasks.set(taskId, updates);
    
    // Log for server-side debugging
    console.log(`[${taskId}] ${progress}% - ${stage}: ${message}`);
  }
  
  /**
   * Mark a task as completed
   */
  completeTask(taskId: string, message: string = 'Generation complete!'): void {
    const updates = this.tasks.get(taskId) || [];
    updates.push({
      taskId,
      stage: 'completed',
      message,
      progress: 100,
      completed: true,
      timestamp: new Date()
    });
    this.tasks.set(taskId, updates);
  }
  
  /**
   * Mark a task as failed
   */
  failTask(taskId: string, error: string): void {
    const updates = this.tasks.get(taskId) || [];
    updates.push({
      taskId,
      stage: 'failed',
      message: 'Generation failed',
      progress: updates[updates.length - 1]?.progress || 0,
      completed: true,
      error,
      timestamp: new Date()
    });
    this.tasks.set(taskId, updates);
  }
  
  /**
   * Get all progress updates for a task
   */
  getProgress(taskId: string): ProgressUpdate[] {
    return this.tasks.get(taskId) || [];
  }
  
  /**
   * Get the latest progress update for a task
   */
  getLatestProgress(taskId: string): ProgressUpdate | null {
    const updates = this.tasks.get(taskId);
    if (!updates || updates.length === 0) return null;
    return updates[updates.length - 1];
  }
  
  /**
   * Check if a task exists
   */
  hasTask(taskId: string): boolean {
    return this.tasks.has(taskId);
  }
  
  /**
   * Clean up a task
   */
  clearTask(taskId: string): void {
    this.tasks.delete(taskId);
  }
}

// Singleton instance
export const progressTracker = new ProgressTracker();
