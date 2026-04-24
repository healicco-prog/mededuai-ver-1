"use client";

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Global App Error]', error);
    }, [error]);

    return (
        <html>
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: '100vh', padding: '2rem'
                }}>
                    <div style={{
                        background: '#fff', border: '1px solid #fecaca', borderRadius: '1.5rem',
                        padding: '2rem', maxWidth: '480px', width: '100%', textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
                    }}>
                        <div style={{
                            width: '3rem', height: '3rem', background: '#fee2e2', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                        }}>
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
                            MedEduAI encountered an error
                        </h2>
                        <p style={{
                            fontSize: '0.8rem', color: '#dc2626', background: '#fee2e2',
                            borderRadius: '0.5rem', padding: '0.5rem 0.75rem', marginBottom: '1.25rem',
                            fontFamily: 'monospace'
                        }}>
                            {error?.message || 'An unexpected error occurred'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '0.625rem 1.25rem', background: '#dc2626', color: '#fff',
                                    border: 'none', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: '0.625rem 1.25rem', background: '#475569', color: '#fff',
                                    border: 'none', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
