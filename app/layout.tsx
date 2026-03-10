import type { Metadata } from "next";
import "../public/assets/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "問い合わせ | 臨床学術ワーキンググループ",
  description: "臨床学術ワーキンググループへの問い合わせフォームです。"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
