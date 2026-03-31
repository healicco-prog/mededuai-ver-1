"use client";

import Link from 'next/link';
import { Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function GlobalHomeButton() {
    const pathname = usePathname();

    // Do not show the button on the main landing page itself
    if (pathname === '/') return null;

    return (
        <Link
            href="/"
            className="fixed bottom-6 right-6 z-[99999] flex items-center justify-center p-3 sm:px-4 sm:py-3 bg-slate-900/90 hover:bg-emerald-500 text-slate-200 hover:text-white backdrop-blur-md border border-white/10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:scale-105 group"
            title="Return to Main Landing Page"
        >
            <Home className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline font-bold text-sm tracking-wide transition-colors">Return to Home</span>
        </Link>
    );
}
