import type { Metadata } from "next";
import { Chakra_Petch, Russo_One } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "P5R 攻略指南 | Persona 5 Royal 人格面具圖鑑與合成規劃",
  description: "Persona 5 Royal 完整攻略網站。包含人格面具圖鑑、属性抗性查詢、合成規劃工具、技能與特性篩選。支援簡體/繁體中文。",
  keywords: ["P5R, Persona 5 Royal, 人格面具, 女神異聞錄, 攻略, 合成, fusion, persona, 遊戲攻略"],
  authors: [{ name: "P5R Guide" }],
  openGraph: {
    title: "P5R 攻略指南 | Persona 5 Royal",
    description: "Persona 5 Royal 完整攻略網站。包含人格面具圖鑑、合成規劃工具。",
    url: "https://p5r.vercel.app",
    siteName: "P5R 攻略指南",
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "P5R 攻略指南",
    description: "Persona 5 Royal 完整攻略網站",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    languages: {
      'zh-TW': 'https://p5r.guide',
      'zh-CN': 'https://p5r.guide',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23fff'/><stop offset='100%25' stop-color='%23ccc'/></linearGradient></defs><path d='M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2z' fill='%23E31C34'/><path d='M10 10c0-2 1.8-3.5 6-3.5s6 1.5 6 3.5c0 1.2-1 2.3-2.5 2.8.5.5 1.5 1.2 2.5 1.2s2-.7 2.5-1.2c-1.5-.5-2.5-1.6-2.5-2.8 0-1.2.8-2.2 2-2.7-.7-.3-1.2-.7-1.5-1.2-.4.7-.7 1.5-.7 2.5 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1-.3-1.8-.7-2.5-.3.5-.8.9-1.5 1.2 1.2.5 2 1.5 2 2.7 0 2-1.6 3.5-4 3.5s-4-1.5-4-3.5c0-1 0-1.8.7-2.5.3-.5.8-.9 1.5-1.2-1.2-.5-2-1.5-2-2.8z' fill='url(%23g)' opacity='0.3'/><ellipse cx='11.5' cy='13' rx='2' ry='2.5' fill='%23000'/><ellipse cx='20.5' cy='13' rx='2' ry='2.5' fill='%23000'/><path d='M11 19c0 0 1.5 2 5 2s5-2 5-2' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'/></svg>" />
      </head>
      <body className={`min-h-screen flex flex-col ${chakraPetch.className}`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
