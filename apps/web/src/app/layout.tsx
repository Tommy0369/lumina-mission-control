import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "LUMINA — 伴走",
  description:
    "どのAIのどのモデルでどこまで作り、次に何を渡すかをデザインし、完成まで伴走する",
};

const NAV = [
  { href: "/", label: "ホーム" },
  { href: "/projects", label: "つくっているもの" },
  { href: "/tasks", label: "いまの作業" },
  { href: "/how-to", label: "使い方" },
];

const MORE = [
  { href: "/runs", label: "依頼の履歴" },
  { href: "/resources", label: "使いすぎ（詳しく）" },
  { href: "/routing", label: "振り分けルール（詳しく）" },
  { href: "/settings", label: "設定" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${plexSans.variable} ${plexMono.variable}`}>
        <div className="mc-shell">
          <aside className="mc-sidebar">
            <div>
              <div className="mc-brand">LUMINA</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                完成まで伴走する
              </div>
            </div>
            <nav className="mc-nav">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <details style={{ marginTop: 8 }}>
              <summary className="mc-muted" style={{ cursor: "pointer", fontSize: 12 }}>
                詳しく
              </summary>
              <nav className="mc-nav" style={{ marginTop: 8 }}>
                {MORE.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </details>
            <div className="mc-muted" style={{ marginTop: "auto" }}>
              とみー専用 · 手動で回す
            </div>
          </aside>
          <main className="mc-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
