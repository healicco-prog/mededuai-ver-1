"use client";

import { useEffect } from 'react';

export default function CreatorError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Creator Page Error]', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-96 p-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-lg w-full text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-red-800 mb-2">Content Creator failed to load</h3>
                <p className="text-sm text-red-600 mb-4 font-mono bg-red-100 rounded-lg px-3 py-2">
                    {error?.message || 'An unexpected error occurred'}
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => {
                            try { localStorage.removeItem('curriculum-storage'); } catch { /* ignore */ }
                            window.location.reload();
                        }}
                        className="px-5 py-2.5 bg-slate-600 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors"
                    >
                        Reset & Reload
                    </button>
                </div>
            </div>
        </div>
    );
}
