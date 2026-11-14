import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Radar } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Radar | 국책과제·공공입찰 통합 포털", template: "%s | Radar" },
  description: "국책과제와 공공입찰 공고를 한곳에서 확인하고 사업비를 계산하세요.",
  icons: { icon: "/radar.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="container flex items-center justify-between gap-4">
            <Link className="brand" href="/" aria-label="Radar 홈">
              <span className="brand-icon"><Radar size={20} /></span>
              Radar<span className="brand-period">.</span>
            </Link>
            <nav className="main-nav" aria-label="주 메뉴">
              <Link href="/#notices">공고 둘러보기</Link>
              <Link href="/calculator/"><Calculator size={16} aria-hidden="true" /> 사업비 계산기</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container flex flex-wrap items-center justify-between gap-3">
            <Link className="footer-brand" href="/"><Radar size={17} aria-hidden="true" /> Radar</Link>
            <span>GrantRadar · BidRadar</span>
            <Link href="/calculator/">사업비 계산기</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
