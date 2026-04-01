import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { ViewportZoomReset } from "@/components/ViewportZoomReset";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "TeamBoard",
  description: "スポーツチーム管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader color="#2563eb" showSpinner={false} height={3} />
        <ViewportZoomReset />
        {children}
      </body>
    </html>
  );
}
