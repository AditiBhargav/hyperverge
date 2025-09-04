// Service Worker Registration Utility
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = true; // Default to true for SSR
  private listeners: Set<(online: boolean) => void> = new Set();

  private constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners();
    }
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register service worker
  async register(): Promise<boolean> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported or not in browser environment');
      return false;
    }

    try {
      console.log('Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Check for existing service worker
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker already controlling the page');
      }

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Unregister service worker (for debugging)
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  // Request background sync for upload queue
  async requestBackgroundSync(tag: string = 'upload-queue'): Promise<boolean> {
    if (typeof window === 'undefined' || !this.registration || !('sync' in this.registration)) {
      console.log('Background Sync not supported or not in browser environment');
      return false;
    }

    try {
      const registration = this.registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      };
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !this.registration?.pushManager) {
      console.log('Push notifications not supported or not in browser environment');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NAsxiJekXYiOOuFZkCAAhhvvb1j4fUmEf7kMoaZn1_9PGIxCJKnH9Q'
        ) as BufferSource
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // Network status monitoring
  private setupNetworkListeners(): void {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.log('Network listeners not available in server environment');
      return;
    }
    
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('Network: Online');
      this.isOnline = true;
      this.notifyNetworkChange(true);
      this.requestBackgroundSync(); // Trigger sync when back online
    });

    window.addEventListener('offline', () => {
      console.log('Network: Offline');
      this.isOnline = false;
      this.notifyNetworkChange(false);
    });
  }

  // Add network status listener
  addNetworkListener(callback: (online: boolean) => void): void {
    this.listeners.add(callback);
  }

  // Remove network status listener
  removeNetworkListener(callback: (online: boolean) => void): void {
    this.listeners.delete(callback);
  }

  // Get current network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(data: { type: string; timestamp?: string; [key: string]: unknown }): void {
    console.log('Message from Service Worker:', data);
    
    switch (data.type) {
      case 'UPLOAD_QUEUE_PROCESSED':
        console.log('Upload queue processed at:', data.timestamp);
        // Notify the app that background sync completed
        window.dispatchEvent(new CustomEvent('uploadQueueProcessed', { detail: data }));
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // Notify about service worker updates
  private notifyUpdate(): void {
    console.log('Service Worker update available');
    
    // You can show a notification to user about update
    window.dispatchEvent(new CustomEvent('serviceWorkerUpdate'));
  }

  // Notify about network changes
  private notifyNetworkChange(online: boolean): void {
    this.listeners.forEach(callback => callback(online));
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Update service worker
  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  // Skip waiting for new service worker
  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

// Export singleton instance - only create when in browser
export const swManager = typeof window !== 'undefined' ? ServiceWorkerManager.getInstance() : null;
