import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_Bengali, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader, SiteFooter } from "@/components/site-shell";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const bengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

const bengaliSerif = Noto_Serif_Bengali({
  variable: "--font-bengali-serif",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "পাতা, বইয়ের নিজস্ব ঠিকানা",
    template: "%s | পাতা",
  },
  description:
    "পাতা, হার্ড কপি, PDF/ই-বুক ও বান্ডেল ফরম্যাটে বাছাই করা বই। সারা বাংলাদেশে ডেলিভারি, নিরাপদ চেকআউট, যাচাইকৃত পেমেন্টের পর তাৎক্ষণিক ডিজিটাল অ্যাক্সেস।",
  keywords: ["বই", "bookstore", "বাংলা বই", "ebook", "PDF", "বাংলাদেশ", "পাতা"],
  openGraph: {
    title: "পাতা, বইয়ের নিজস্ব ঠিকানা",
    description: "হার্ড কপি, PDF/ই-বুক ও বান্ডেল, এক বই, আপনার পছন্দের ফরম্যাটে।",
    url: siteUrl,
    siteName: "পাতা",
    type: "website",
    locale: "bn_BD",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5f1e6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} ${bengali.variable} ${bengaliSerif.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
        >
          মূল কন্টেন্টে যান
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
