import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link'
import PlayerSearch from "../components/ui/search";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        //className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="app-container">

          <header className="topbar">
            <div className="topbar-left">
              <Link href="/" className="logo">Emerald!</Link>
            </div>

            <div className="topbar-right">
              <div className="searchbar">
                <PlayerSearch/>
              </div>
              <div className="user">
                <Link href="/profile">Username</Link>
              </div>
            </div>
          </header>

          <aside className="sidebar">
            <div className="nav">
              <Link href="/">Home</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/player">Player</Link>
              <Link href="/draft">Draft</Link>
              <Link href="/evaluation">Team Evaluation</Link>
              <Link href="/feed">Sports Feed</Link>
            </div>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
