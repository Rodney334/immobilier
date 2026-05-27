import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// ─── Polices ──────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── Métadonnées ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Estate Mangement - Gestion Immobilière",
    template: "%s | Estate Mangement",
  },
  description:
    "Plateforme de gestion immobilière pour propriétaires sérieux. Suivez vos biens, locataires, contrats et paiements en un seul endroit.",
};

// ─── Layout racine ────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral text-primary">
        {/*
         * ToastProvider :
         *   - Fournit le hook useToast() à toute l'application
         *   - Rend automatiquement le <Toaster> (zone de notifications top-right)
         */}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
