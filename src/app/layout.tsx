import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppSidebar } from "@/components/layout/sidebar";
import { BreadcrumbNav } from "@/components/layout/breadcrumb";
import { SiteHeader } from "@/components/layout/site-header";
import { MarketTicker } from "@/components/market/ticker-bar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI 智投 — A股 AI 智能分析平台",
    template: "%s | AI 智投",
  },
  description:
    "AI 智投 — 基于 Multi-Agent 协作架构的 A 股 AI 智能分析平台。12+ AI 智能体协作分析，投资委员会辩论，Deep Research，AI 盯盘。",
  keywords: ["A股", "AI", "股票分析", "智能投资", "Multi-Agent", "投资委员会"],
  authors: [{ name: "AI Smart Invest Team" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    title: "AI 智投 — A股 AI 智能分析平台",
    description: "12+ AI 智能体协作分析，投资委员会辩论，Deep Research，AI 盯盘",
    siteName: "AI 智投",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <SiteHeader />
              <div className="px-6 pt-4">
                <BreadcrumbNav />
              </div>
              <main className="flex-1 overflow-auto px-6 py-4">
                {children}
              </main>
              <MarketTicker />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
