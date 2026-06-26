import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dream_welcomer",
  description: "AI shopping guide for focused product discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
