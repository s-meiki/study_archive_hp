import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { siteUrl } from "./site-url";
import { ProgressProvider } from "./learning/progress-context";
import { ThemeProvider } from "./theme/theme-provider";
import { themeInitScript } from "./theme/theme-script";
import { AppHeader } from "./components/app-header";
import { AppFooter } from "./components/app-footer";

const latinFont = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap"
});

const jpFont = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap"
});

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
    <html lang="ja" suppressHydrationWarning className={`${latinFont.variable} ${jpFont.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ProgressProvider>
            <AppHeader />
            <main id="main" className="wrap">
              {children}
            </main>
            <AppFooter />
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
