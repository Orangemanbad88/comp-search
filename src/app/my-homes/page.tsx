'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { getSavedAnalyses, deleteAnalysis } from '@/lib/storage';
import { SavedAnalysis } from '@/types/analysis';

export default function MyHomesPage() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAnalyses(getSavedAnalyses());
  }, []);

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
    setAnalyses(getSavedAnalyses());
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#0a0a0f]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-walnut/10 dark:bg-gold/10 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-walnut/5 dark:bg-gold/5 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0a0a0f]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-semibold text-charcoal dark:text-cream">My Homes</h2>
          <p className="text-walnut dark:text-cream/60 mt-1">Your saved comp analyses</p>
        </div>

        {analyses.length === 0 ? (
          /* Empty State */
          <div className="card-premium rounded-xl p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-burgundy/10 to-burgundy/5 dark:from-gold/10 dark:to-gold/5 flex items-center justify-center border border-burgundy/20 dark:border-gold/20">
              <svg className="w-10 h-10 text-burgundy/60 dark:text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-semibold text-charcoal dark:text-cream mb-2">No Saved Analyses Yet</h3>
            <p className="text-walnut dark:text-cream/60 max-w-md mx-auto leading-relaxed mb-6">
              Run a comp search, select comparables, and save your analysis to access it later.
            </p>
            <Link
              href="/"
              className="btn-premium inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Start an Analysis
            </Link>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map(analysis => (
              <div
                key={analysis.id}
                className="card-premium rounded-xl overflow-hidden border border-walnut/10 dark:border-gold/20 hover:shadow-lg transition-shadow"
              >
                <div className="px-5 py-4 border-b border-walnut/10 dark:border-gold/10 bg-gradient-to-r from-cream to-ivory dark:from-[#111118] dark:to-[#1a1a24]">
                  <h3 className="font-display text-lg font-semibold text-charcoal dark:text-cream truncate">
                    {analysis.name}
                  </h3>
                  <p className="text-xs text-walnut/60 dark:text-cream/40 mt-0.5">
                    Saved {new Date(analysis.savedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-walnut/70 dark:text-cream/50">Subject</span>
                    <span className="text-charcoal dark:text-cream font-medium truncate ml-2 max-w-[60%] text-right">
                      {analysis.subject.address}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-walnut/70 dark:text-cream/50">Comps</span>
                    <span className="text-charcoal dark:text-cream font-medium">{analysis.selectedComps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-walnut/70 dark:text-cream/50">Mode</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      analysis.searchMode === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-burgundy/10 text-burgundy dark:bg-gold/10 dark:text-gold-light'
                    }`}>
                      {analysis.searchMode === 'active' ? 'Active' : 'Sold'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-walnut/70 dark:text-cream/50">Indicated Value</span>
                    <span className="text-charcoal dark:text-cream font-display font-semibold">
                      ${analysis.indicatedValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="px-5 pb-5 flex gap-3">
                  <Link
                    href={`/?load=${analysis.id}`}
                    className="flex-1 btn-premium text-center px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Open Analysis
                  </Link>
                  <button
                    onClick={() => handleDelete(analysis.id)}
                    className="px-3 py-2 rounded-lg text-sm border border-walnut/20 dark:border-gold/20 text-walnut/60 dark:text-cream/40 hover:text-red-600 hover:border-red-300 dark:hover:text-red-400 dark:hover:border-red-400/30 transition-colors"
                    aria-label="Delete analysis"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
