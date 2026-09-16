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
  title: "LUMINA Mission Control",
  description: "Plan. Route. Build. Review. Learn.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/missions", label: "Missions" },
  { href: "/tasks", label: "Tasks" },
  { href: "/runs", label: "Runs" },
  { href: "/resources", label: "AI Resources" },
  { href: "/routing", label: "Routing" },
  { href: "/settings", label: "Settings" },
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
                Mission Control
              </div>
            </div>
            <nav className="mc-nav">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mc-muted" style={{ marginTop: "auto" }}>
              Manual Orchestration · V0.1
              <div style={{ marginTop: 8 }}>Tommy</div>
            </div>
          </aside>
          <main className="mc-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
