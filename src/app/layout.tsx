import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Star } from "lucide-react";
import "./global.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interactive Data Dashboard",
  description: "An interactive data dashboard built with Next.js & shadcn/UI",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {/* ─── Header ─────────────────────────────────────────────── */}
        <header className="bg-white shadow sticky w-full ">
          <div className="container mx-auto flex items-center justify-between py-4 px-6">
            <Link href="/" className="text-xl font-bold">
              📊 Interactive Data Dashboard
            </Link>
            <nav className="space-x-4">
              {/* Other links… */}
              <Link
                href="https://github.com/RowanWhitethorn/interactive-data-dashboard"change for my repo link
                target="_blank"
                rel="noopener"
                className="inline-flex items-center space-x-1 text-gray-700 hover:text-gray-900"
              >
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Star on GitHub</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* ─── Main Content ───────────────────────────────────────── */}
        <main className="container mx-auto py-8 px-6">{children}</main>

        {/* ─── Footer ─────────────────────────────────────────────── */}
        <footer className="bg-white border-t">
          <div className="container mx-auto py-4 px-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Jose Diaz • Built with Next.js & shadcn/UI
          </div>
        </footer>
      </body>
    </html>
  );
}
