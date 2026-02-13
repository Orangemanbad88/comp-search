'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeProvider';

interface HeaderProps {
  children?: ReactNode;
}

export const Header = ({ children }: HeaderProps) => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Search' },
    { href: '/my-homes', label: 'My Homes' },
  ];

  return (
    <header className="sticky top-0 z-40 wood-grain border-b border-walnut-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-walnut-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-cream tracking-wide">CompAtlas</h1>
                <p className="text-xs text-gold-light/80 hidden sm:block tracking-wider uppercase">Premium Appraisal Intelligence</p>
              </div>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gold/20 text-gold-light border border-gold/30'
                        : 'text-cream/60 hover:text-cream hover:bg-walnut-dark/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {children}
            <Link
              href="/login"
              className="p-2 rounded-lg bg-walnut-dark/50 hover:bg-walnut-dark/70 border border-gold/20 transition-colors"
              aria-label="Login"
            >
              <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
