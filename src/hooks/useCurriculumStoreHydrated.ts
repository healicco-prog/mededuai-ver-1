"use client";

import { useState, useEffect } from 'react';

/**
 * useCurriculumStoreHydrated
 *
 * Returns `false` on the first render (SSR + React hydration pass) and `true`
 * after the component has mounted on the client.
 *
 * This prevents the React hydration mismatch crash caused by Zustand's persist
 * middleware loading persisted localStorage data (e.g. generated notes) that
 * differs from the server-rendered default state.
 *
 * Usage:
 *   const hydrated = useCurriculumStoreHydrated();
 *   if (!hydrated) return <LoadingSkeleton />;
 *
 * Intentionally avoids Zustand internal APIs (persist.rehydrate etc.) so it
 * works with Zustand v4, v5, and beyond.
 */
export function useCurriculumStoreHydrated(): boolean {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // useEffect only runs on the client, after React hydration is complete.
        // Setting state here causes a re-render with the store's real persisted data.
        setMounted(true);
    }, []);

    return mounted;
}
