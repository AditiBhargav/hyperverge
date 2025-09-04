'use client';
import { useState } from 'react';
import { usePWA } from './PWAProvider';

export default function PWANotifications() {
  const { isOnline, isInstallable, hasUpdate, installApp, updateApp, dismissUpdate } = usePWA();
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  // Show offline notice when going offline
  useState(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined' && !isOnline && !showOfflineNotice) {
      setShowOfflineNotice(true);
      // Auto hide after 5 seconds
      setTimeout(() => setShowOfflineNotice(false), 5000);
    }
  });

  return (
    <>
      {/* Network Status */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
          isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>

      {/* Offline Notice */}
      {showOfflineNotice && !isOnline && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md">
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">📱</span>
                <div>
                  <p className="font-medium">You&apos;re offline</p>
                  <p className="text-sm">Don&apos;t worry! You can still capture documents. They&apos;ll sync when you&apos;re back online.</p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineNotice(false)}
                className="text-orange-700 hover:text-orange-900 font-bold text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {isInstallable && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">📱</span>
                <div>
                  <p className="font-medium">Install KYC Lite</p>
                  <p className="text-sm">Install our app for a better experience and offline access.</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={installApp}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Install
                </button>
                <button
                  onClick={() => {/* Handle dismiss */}}
                  className="text-blue-700 hover:text-blue-900 text-sm"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Available */}
      {hasUpdate && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">🔄</span>
                <div>
                  <p className="font-medium">Update Available</p>
                  <p className="text-sm">A new version of KYC Lite is ready to install.</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={updateApp}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Update
                </button>
                <button
                  onClick={dismissUpdate}
                  className="text-green-700 hover:text-green-900 text-sm"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
