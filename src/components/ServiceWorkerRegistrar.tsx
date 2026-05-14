'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // In development mode, unregister any active service workers to prevent stale asset cache interference on hard refresh
      if (process.env.NODE_ENV !== 'production') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        return;
      }

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Auto-update on new service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => { /* SW state change handled silently */ });
            }
          });
        })
        .catch((err) => {
          console.warn('[MedEduAI] SW registration failed:', err);
        });
    }
  }, []);

  return null;
}
