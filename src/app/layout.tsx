import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalHomeButton from "../components/GlobalHomeButton";
import ServiceWorkerRegistrar from "../components/ServiceWorkerRegistrar";
import InstallPWAButton from "../components/InstallPWAButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedEduAI – AI-Powered Medical Education Platform",
  description: "The all-in-one AI web portal for MBBS, BDS, and Nursing students. Viva simulator, AI notes, MCQ generator and more.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/icons/icon-192x192.png',
    shortcut: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MedEduAI",
    startupImage: '/icons/icon-512x512.png',
  },
  applicationName: "MedEduAI",
  keywords: ["medical education", "AI", "MBBS", "BDS", "Nursing", "viva simulator", "MCQ generator", "medical notes"],
  openGraph: {
    title: "MedEduAI – AI-Powered Medical Education Platform",
    description: "The all-in-one AI web portal for MBBS, BDS, and Nursing students.",
    siteName: "MedEduAI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MedEduAI" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <GlobalHomeButton />
        <ServiceWorkerRegistrar />
        <InstallPWAButton />
      </body>
    </html>
  );
}
