import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "趣测小屋 - 创意问卷平台",
  description: "AI驱动的创意问卷平台，3分钟创建性格测试、闺蜜默契度等爆款内容",
  keywords: "问卷,测试,性格测试,MBTI,小红书,趣味测试",
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: "趣测小屋 - 创意问卷平台",
    description: "AI驱动的创意问卷平台，让每一份测试都值得分享",
    type: "website",
    siteName: "趣测小屋",
  },
  other: {
    'twitter:card': 'summary',
    'twitter:title': '趣测小屋 - 创意问卷平台',
    'twitter:description': 'AI驱动的创意问卷平台，让每一份测试都值得分享',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
