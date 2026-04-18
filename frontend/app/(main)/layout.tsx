import { Suspense } from 'react';
import Link from 'next/link';
import PlayerSearch from '@/components/ui/search';
import HeaderUserMenu from '@/components/ui/login-status';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-container">

      <header className="topbar">
        <div className="topbar-left">
          <Link href="/" className="logo">Emerald!</Link>
        </div>

        <div className="topbar-right">
          <div className="searchbar">
            <Suspense fallback={<>Search for player...</>}>
              <PlayerSearch/>
            </Suspense>
          </div>
          <div className="user">
            <HeaderUserMenu />
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="nav">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/players">Player</Link>
          <Link href="/draft">Draft</Link>
          <Link href="/evaluation">Evaluation</Link>
          <Link href="/feed">Sports Feed</Link>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
