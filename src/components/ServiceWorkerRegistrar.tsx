'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[MedEduAI] SW registered:', registration.scope);
          
          // Auto-update on new service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[MedEduAI] New SW activated — refreshing for updates.');
                }
              });
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
