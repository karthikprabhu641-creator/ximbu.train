/**
 * Asset Manager
 * Handles loading progress, caching, and readiness for Phase 2 3D assets.
 */
export class AssetManager {
  constructor() {
    this.totalItems = 0;
    this.loadedItems = 0;
    this.isLoading = false;
    this.onProgress = null;
    this.onComplete = null;
  }

  /**
   * Registers a task to track
   */
  startTask() {
    this.totalItems++;
    this.isLoading = true;
    this.notifyProgress();
  }

  /**
   * Marks a task completed
   */
  completeTask() {
    this.loadedItems++;
    this.notifyProgress();
    if (this.loadedItems >= this.totalItems) {
      this.isLoading = false;
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }
  }

  /**
   * Returns current loading ratio (0 to 1)
   */
  getProgress() {
    if (this.totalItems === 0) return 1;
    return Math.min(1, this.loadedItems / this.totalItems);
  }

  notifyProgress() {
    const ratio = this.getProgress();
    if (typeof this.onProgress === 'function') {
      this.onProgress(ratio);
    }
  }
}
