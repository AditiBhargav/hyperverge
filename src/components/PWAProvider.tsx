'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { swManager } from '../lib/serviceWorker';

interface PWAContextType {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  installApp: () => Promise<void>;
  updateApp: () => void;
  dismissUpdate: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Register service worker
    const registerSW = async () => {
      if (!swManager) return;
      
      const registered = await swManager.register();
      if (registered) {
        console.log('PWA: Service Worker registered successfully');
      }
    };

    registerSW();

    // Set up network status
    if (typeof navigator !== 'undefined' && swManager) {
      setIsOnline(navigator.onLine);
      swManager.addNetworkListener(setIsOnline);
    }

    // Check if app is installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA: Install prompt available');
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA: App installed successfully');
    };

    // Handle service worker update
    const handleServiceWorkerUpdate = () => {
      setHasUpdate(true);
      console.log('PWA: Service Worker update available');
    };

    // Handle background sync completion
    const handleUploadQueueProcessed = (event: CustomEvent) => {
      console.log('PWA: Background sync completed:', event.detail);
      // You can show a notification or update UI here
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate);
    window.addEventListener('uploadQueueProcessed', handleUploadQueueProcessed as EventListener);

    return () => {
      // Cleanup
      if (swManager) {
        swManager.removeNetworkListener(setIsOnline);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate);
      window.removeEventListener('uploadQueueProcessed', handleUploadQueueProcessed as EventListener);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt || !deferredPrompt.prompt) return;

    try {
      await deferredPrompt.prompt();
      
      if (deferredPrompt.userChoice) {
        const result = await deferredPrompt.userChoice;
        const outcome = result?.outcome;
        
        if (outcome === 'accepted') {
          console.log('PWA: User accepted install prompt');
        } else {
          console.log('PWA: User dismissed install prompt');
        }
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('PWA: Install failed:', error);
    }
  };

  const updateApp = () => {
    if (swManager) {
      swManager.skipWaiting();
    }
    setHasUpdate(false);
    // Reload page to activate new service worker
    window.location.reload();
  };

  const dismissUpdate = () => {
    setHasUpdate(false);
  };

  const value: PWAContextType = {
    isOnline,
    isInstallable,
    isInstalled,
    hasUpdate,
    installApp,
    updateApp,
    dismissUpdate,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}
