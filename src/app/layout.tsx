import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Hind_Siliguri, Noto_Serif_Bengali, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader, SiteFooter } from "@/components/site-shell";

/* Latin display serif with real editorial personality */
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

/* Bengali body text */
const bengali = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

/* Bengali literary serif for headlines */
const bengaliSerif = Noto_Serif_Bengali({
  variable: "--font-bengali-serif",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/* Print-style mono for labels, indices and numbers */
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
  themeColor: "#faf9f4", // warm white
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
        className={`${display.variable} ${body.variable} ${bengali.variable} ${bengaliSerif.variable} ${mono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
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
