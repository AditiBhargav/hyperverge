'use client';
import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide the indicator after 3 seconds when coming back online
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator && isOnline) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      showIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`flex items-center px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium ${
        isOnline 
          ? 'bg-green-600' 
          : 'bg-red-600'
      }`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          isOnline 
            ? 'bg-green-300 animate-pulse' 
            : 'bg-red-300'
        }`}></div>
        {isOnline ? (
          <>
            <span className="mr-1">🔄</span>
            Back Online
          </>
        ) : (
          <>
            <span className="mr-1">📱</span>
            Working Offline
          </>
        )}
      </div>
    </div>
  );
}
