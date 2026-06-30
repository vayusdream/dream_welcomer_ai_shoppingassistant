import type { Metadata } from "next";
import type * as React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "dream_welcomer",
    template: "%s | dream_welcomer",
  },
  description: "AI 驱动的电商导购平台，帮助用户通过自然语言发现合适商品。",
  applicationName: "dream_welcomer",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <div className="min-h-screen">
          <header className="border-b border-[var(--line)] bg-[rgba(255,253,248,0.9)]">
            <nav
              aria-label="主导航"
              className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
            >
              <a href="/" className="text-base font-semibold tracking-normal">
                dream_welcomer
              </a>
              <a
                href="/"
                className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink-soft)] transition hover:border-[var(--teal)] hover:text-[var(--teal-dark)]"
              >
                AI 导购
              </a>
            </nav>
          </header>
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}
