import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "./site-url";
import { ProgressProvider } from "./learning/progress-context";

export const metadata: Metadata = {
  title: "臨床学術ワーキンググループ",
  description: "臨床学術ワーキンググループの関係者向け学習アーカイブです。",
  metadataBase: siteUrl ?? undefined,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
