'use client';

import Link from 'next/link';

export function AppShell({ title, subtitle, children, links }: { title: string; subtitle?: string; children: React.ReactNode; links: { href: string; label: string }[] }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand.dark via-slate-900 to-slate-800 pb-10 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900">
              Logout
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6">{children}</main>
    </div>
  );
}
