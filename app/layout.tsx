import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tabi — AI 旅行规划助手",
  description: "描述你的出行想法，Tabi 用 AI 帮你生成专属旅行行程，包含每日安排、交通、住宿和贴士。",
  metadataBase: new URL("https://www.asktabi.com"),
  openGraph: {
    title: "Tabi — AI 旅行规划助手",
    description: "描述你的出行想法，Tabi 用 AI 帮你生成专属旅行行程，包含每日安排、交通、住宿和贴士。",
    url: "https://www.asktabi.com",
    siteName: "Tabi",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabi — AI 旅行规划助手",
    description: "描述你的出行想法，Tabi 用 AI 帮你生成专属旅行行程，包含每日安排、交通、住宿和贴士。",
  },
  alternates: {
    canonical: "https://www.asktabi.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
