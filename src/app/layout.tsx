import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "유네코레일 전기파트 - 업무관리 시스템",
  description: "전기파트 재고관리, 업무일지, SOP 등을 통합 관리하는 웹 애플리케이션",
  keywords: ["재고관리", "전기파트", "업무관리", "유네코레일"],
  authors: [{ name: "JYJ" }],
  creator: "JYJ",
  publisher: "유네코레일",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
