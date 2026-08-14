import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AppInit from "@/components/AppInit";
import SyncManager from "@/components/SyncManager";

export const metadata: Metadata = {
  title: "PantryAI",
  description: "Personal food assistant: budget, pantry, meal plan, and shopping.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PantryAI",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F7F5F0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <ServiceWorkerRegister />
        <AppInit />
        <SyncManager />
        <main className="flex-1 pb-28 pt-safe">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
