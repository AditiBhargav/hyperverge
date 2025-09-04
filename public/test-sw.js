// Empty test service worker to prevent 404 errors
// This file exists to handle requests for test-sw.js that might come from:
// - Browser extensions (React DevTools, Vue DevTools, etc.)
// - Developer tools testing features
// - VS Code browser integration
// - Other development tools

console.log('Test service worker loaded (empty implementation)');
console.log('Source of request - check browser DevTools Network tab for initiator');

// Log the request details for debugging
console.log('test-sw.js loaded at:', new Date().toISOString());
console.log('User agent:', navigator.userAgent);

// Immediately skip waiting and activate
self.addEventListener('install', () => {
  console.log('Test SW: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Test SW: Activating...');
  // Don't do anything, just activate
});

// Handle fetch events by passing through to network
self.addEventListener('fetch', (event) => {
  // Just pass through to network, don't cache anything
  event.respondWith(fetch(event.request));
});
