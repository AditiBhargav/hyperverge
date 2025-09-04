'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugPage() {
  const [swRegistrations, setSwRegistrations] = useState<ServiceWorkerRegistration[]>([]);
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    const checkServiceWorkers = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          setSwRegistrations([...registrations]);
          setStatus(`Found ${registrations.length} service worker registrations`);
          
          // Log all registrations
          registrations.forEach((registration, index) => {
            console.log(`SW Registration ${index}:`, {
              scope: registration.scope,
              active: registration.active?.scriptURL,
              installing: registration.installing?.scriptURL,
              waiting: registration.waiting?.scriptURL
            });
          });
        } catch (error) {
          setStatus(`Error checking service workers: ${error}`);
          console.error('Error checking service workers:', error);
        }
      } else {
        setStatus('Service Workers not supported');
      }
    };

    checkServiceWorkers();
  }, []);

  const unregisterAll = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Unregistered SW:', registration.scope);
        }
        
        setStatus(`Unregistered ${registrations.length} service workers`);
        setSwRegistrations([]);
        
        // Reload the page to clear any cached resources
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        setStatus(`Error unregistering: ${error}`);
      }
    }
  };

  const clearCaches = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
        setStatus(`Cleared ${cacheNames.length} caches`);
        console.log('Cleared caches:', cacheNames);
      } catch (error) {
        setStatus(`Error clearing caches: ${error}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Service Worker Debug Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          <p className="text-gray-700">{status}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={unregisterAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Unregister All Service Workers
            </button>
            <button
              onClick={clearCaches}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Clear All Caches
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Service Worker Registrations ({swRegistrations.length})
          </h2>
          {swRegistrations.length === 0 ? (
            <p className="text-gray-500">No service workers registered</p>
          ) : (
            <div className="space-y-4">
              {swRegistrations.map((registration, index) => (
                <div key={index} className="border p-4 rounded">
                  <p><strong>Scope:</strong> {registration.scope}</p>
                  {registration.active && (
                    <p><strong>Active:</strong> {registration.active.scriptURL}</p>
                  )}
                  {registration.installing && (
                    <p><strong>Installing:</strong> {registration.installing.scriptURL}</p>
                  )}
                  {registration.waiting && (
                    <p><strong>Waiting:</strong> {registration.waiting.scriptURL}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to KYC App
          </Link>
        </div>
      </div>
    </div>
  );
}
