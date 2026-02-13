'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream dark:bg-[#0a0a0f]">
      <Header />

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="card-premium rounded-2xl overflow-hidden border border-walnut/10 dark:border-gold/20">
          {/* Leather Header */}
          <div className="leather-texture px-6 py-5 text-center">
            <div className="relative z-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-walnut-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-semibold text-cream">Welcome Back</h2>
              <p className="text-sm text-cream/60 mt-1">Sign in to your CompAtlas account</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-gold/10 dark:bg-gold/5 border border-gold/20 p-3 text-center">
              <p className="text-sm text-walnut dark:text-gold-light font-medium">Demo Mode</p>
              <p className="text-xs text-walnut/60 dark:text-cream/50 mt-0.5">Authentication coming soon</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-walnut dark:text-cream/70 mb-1">Email</label>
              <input
                type="email"
                disabled
                placeholder="agent@realty.com"
                className="input-premium w-full px-3 py-2.5 rounded-lg text-charcoal dark:text-cream dark:bg-[#1a1a24] dark:border-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-walnut dark:text-cream/70 mb-1">Password</label>
              <input
                type="password"
                disabled
                placeholder="••••••••"
                className="input-premium w-full px-3 py-2.5 rounded-lg text-charcoal dark:text-cream dark:bg-[#1a1a24] dark:border-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              disabled
              className="btn-premium w-full px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign In
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-walnut/10 dark:border-gold/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-cream dark:bg-[#111118] px-3 text-xs text-walnut/50 dark:text-cream/40">or</span>
              </div>
            </div>

            <Link
              href="/"
              className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium border border-walnut/20 dark:border-gold/20 text-walnut dark:text-cream/70 hover:bg-walnut/5 dark:hover:bg-gold/5 transition-colors"
            >
              Continue as Guest
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
