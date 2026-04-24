'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
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
