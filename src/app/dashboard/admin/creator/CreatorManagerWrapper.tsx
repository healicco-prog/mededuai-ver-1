"use client";

/**
 * Client-component wrapper that loads CreatorManagerClient with ssr:false.
 *
 * next/dynamic({ ssr: false }) is only permitted inside Client Components.
 * The page.tsx is a Server Component (uses cookies()), so the dynamic import
 * must live here instead.
 */

import dynamic from 'next/dynamic';

const CreatorManagerClient = dynamic(() => import('./CreatorManagerClient'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-400 font-semibold">Loading Content Creator...</p>
            </div>
        </div>
    ),
});

export default function CreatorManagerWrapper() {
    return <CreatorManagerClient />;
}
