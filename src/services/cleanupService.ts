import { cleanupExpiredTokens } from '../lib/database';

class CleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 phút

  start() {
    if (this.intervalId) {
      return; // Already running
    }

    console.log('Starting QR token cleanup service...');
    
    // Run cleanup immediately
    this.runCleanup();
    
    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('QR token cleanup service stopped');
    }
  }

  private async runCleanup() {
    try {
      await cleanupExpiredTokens();
      console.log('QR token cleanup completed');
    } catch (error) {
      console.error('QR token cleanup failed:', error);
    }
  }
}

export const cleanupService = new CleanupService();
