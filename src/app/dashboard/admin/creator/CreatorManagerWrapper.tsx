"use client";

/**
 * Client-component wrapper for CreatorManagerClient.
 *
 * Note: next/dynamic({ ssr: false }) is NOT needed in Next.js App Router because
 * "use client" components are never SSR-rendered by the server in this architecture.
 * Using React.lazy() / next/dynamic can cause "Element type is invalid" crashes in
 * Next.js 16 + React 19 + Turbopack when the lazy module resolves to undefined.
 * Direct import avoids this entirely.
 */

import CreatorManagerClient from './CreatorManagerClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function CreatorManagerWrapper() {
    return (
        <ErrorBoundary>
            <CreatorManagerClient />
        </ErrorBoundary>
    );
}
