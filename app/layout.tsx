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
  title: "Tabi — AI 旅行助手",
  description: "用自然语言描述出行需求，AI 帮你找到最合适的机票和酒店",
  metadataBase: new URL("https://www.asktabi.com"),
  openGraph: {
    title: "Tabi — AI 旅行助手",
    description: "用自然语言描述出行需求，AI 帮你找到最合适的机票和酒店",
    url: "https://www.asktabi.com",
    siteName: "Tabi",
    locale: "zh_CN",
    type: "website",
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
