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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path fill='%23E31C34' d='M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 2c6.627 0 12 5.373 12 12s-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4z'/><path fill='white' d='M10 10c0-1.5 2-3 6-3s6 1.5 6 3c0 1-1 2-2 2h-8c-1 0-2-1-2-2z'/><circle cx='12' cy='14' r='1.5' fill='white'/><circle cx='20' cy='14' r='1.5' fill='white'/><path fill='%23E31C34' d='M12 18c0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2l-1-4h-6l-1 4z'/></svg>" />
      </head>
      <body className={`min-h-screen flex flex-col ${chakraPetch.className}`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
