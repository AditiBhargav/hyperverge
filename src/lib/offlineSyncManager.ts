import { ReviewAction } from '../types/dashboard';
import { KYCSession } from '../types';

interface SyncQueueItem {
  id: string;
  type: 'REVIEW_SUBMISSION' | 'STATUS_UPDATE' | 'BULK_ACTION';
  data: ReviewSubmissionData | StatusUpdateData | BulkActionData;
  timestamp: string;
  retryCount: number;
}

interface ReviewSubmissionData {
  sessionId: string;
  reviewAction: ReviewAction;
}

interface StatusUpdateData {
  sessionId: string;
  status: KYCSession['status'];
}

interface BulkActionData {
  action: string;
  sessionIds: string[];
}

class OfflineSyncManager {
  private static readonly SYNC_QUEUE_KEY = 'dashboard-sync-queue';
  private static readonly MAX_RETRIES = 3;

  // Add action to sync queue when offline
  static async queueForSync(type: SyncQueueItem['type'], data: SyncQueueItem['data']): Promise<void> {
    if (typeof window === 'undefined') return;

    const queueItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    const queue = this.getSyncQueue();
    queue.push(queueItem);
    
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }
  }

  // Process sync queue when coming back online
  static async processSyncQueue(): Promise<void> {
    if (typeof window === 'undefined') return;

    const queue = this.getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued sync items...`);

    const processedItems: string[] = [];
    
    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        processedItems.push(item.id);
        console.log(`Synced item: ${item.type}`);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Increment retry count
        item.retryCount++;
        
        // Remove if max retries exceeded
        if (item.retryCount >= this.MAX_RETRIES) {
          processedItems.push(item.id);
          console.error(`Max retries exceeded for item ${item.id}, removing from queue`);
        }
      }
    }

    // Remove processed items from queue
    const updatedQueue = queue.filter(item => !processedItems.includes(item.id));
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));

    if (processedItems.length > 0) {
      // Broadcast sync completion
      window.dispatchEvent(new CustomEvent('dashboard-sync-complete', {
        detail: { syncedCount: processedItems.length }
      }));
    }
  }

  private static async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { DashboardService } = await import('../lib/dashboardService');
    
    switch (item.type) {
      case 'REVIEW_SUBMISSION':
        const reviewData = item.data as ReviewSubmissionData;
        await DashboardService.submitReview(reviewData.sessionId, reviewData.reviewAction);
        break;
        
      case 'STATUS_UPDATE':
        const statusData = item.data as StatusUpdateData;
        const { DatabaseService } = await import('../lib/db');
        await DatabaseService.updateSessionStatus(statusData.sessionId, statusData.status);
        break;
        
      case 'BULK_ACTION':
        // Handle bulk actions when implemented
        console.log('Bulk action sync not yet implemented');
        break;
        
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  private static getSyncQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const queue = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error reading sync queue:', error);
      return [];
    }
  }

  // Get pending sync count for UI display
  static getPendingSyncCount(): number {
    return this.getSyncQueue().length;
  }

  // Clear sync queue (for testing or reset)
  static clearSyncQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
  }

  // Initialize sync manager - call this when the app starts
  static initialize(): void {
    if (typeof window === 'undefined') return;

    // Process queue when coming online
    window.addEventListener('online', () => {
      console.log('Back online, processing sync queue...');
      this.processSyncQueue();
    });

    // Process queue on page load if online
    if (navigator.onLine) {
      // Small delay to let the app initialize
      setTimeout(() => this.processSyncQueue(), 1000);
    }
  }
}

export default OfflineSyncManager;
