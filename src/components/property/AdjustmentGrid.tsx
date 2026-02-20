'use client';

import { useState, useEffect, useRef } from 'react';
import { CompResult, SubjectProperty } from '@/types/property';
import { formatCurrency, cn } from '@/lib/utils';
import { getActiveAdjustmentValues } from '@/lib/storage';
import { SaleAdjustmentValues } from '@/types/settings';

interface Adjustment {
  bedroom: number;
  bathroom: number;
  sqft: number;
  age: number;
  other: number;
}

interface CompAdjustments {
  [compId: string]: Adjustment;
}

interface AdjustmentGridProps {
  selectedComps: CompResult[];
  subject: SubjectProperty;
  onAdjustmentsChange?: (adjustments: CompAdjustments, indicatedValue: number) => void;
}

export type { CompAdjustments, Adjustment };

export function AdjustmentGrid({ selectedComps, subject, onAdjustmentsChange }: AdjustmentGridProps) {
  const [adjustments, setAdjustments] = useState<CompAdjustments>({});
  const [otherInputs, setOtherInputs] = useState<{ [compId: string]: string }>({});
  const [adjValues, setAdjValues] = useState<SaleAdjustmentValues>({ bedroom: 25000, bathroom: 15000, sqft: 150, age: 3000 });

  useEffect(() => {
    setAdjValues(getActiveAdjustmentValues());
  }, []);

  useEffect(() => {
    setAdjustments((prevAdjustments) => {
      const newAdjustments: CompAdjustments = {};
      selectedComps.forEach((comp) => {
        const bedDiff = subject.bedrooms - comp.bedrooms;
        const bathDiff = subject.bathrooms - comp.bathrooms;
        const sqftDiff = subject.sqft - comp.sqft;
        // Age: if subject is newer (higher yearBuilt) than comp, comp is inferior → add value
        // If subject is older (lower yearBuilt) than comp, comp is superior → subtract value
        const ageDiff = subject.yearBuilt && comp.yearBuilt
          ? (subject.yearBuilt - comp.yearBuilt)
          : 0;

        newAdjustments[comp.id] = {
          bedroom: bedDiff * adjValues.bedroom,
          bathroom: bathDiff * adjValues.bathroom,
          sqft: sqftDiff * adjValues.sqft,
          age: ageDiff * adjValues.age,
          other: prevAdjustments[comp.id]?.other || 0,
        };
      });
      return newAdjustments;
    });
  }, [selectedComps, subject, adjValues]);

  const handleOtherChange = (compId: string, value: string) => {
    setOtherInputs({ ...otherInputs, [compId]: value });
    const numValue = parseFloat(value) || 0;
    setAdjustments({
      ...adjustments,
      [compId]: {
        ...adjustments[compId],
        other: numValue,
      },
    });
  };

  const getAdjustedPrice = (comp: CompResult): number => {
    const adj = adjustments[comp.id];
    if (!adj) return comp.salePrice;
    return comp.salePrice + adj.bedroom + adj.bathroom + adj.sqft + adj.age + adj.other;
  };

  const getTotalAdjustment = (comp: CompResult): number => {
    const adj = adjustments[comp.id];
    if (!adj) return 0;
    return adj.bedroom + adj.bathroom + adj.sqft + adj.age + adj.other;
  };

  const averageAdjustedPrice = selectedComps.length > 0
    ? Math.round(selectedComps.reduce((sum, comp) => sum + getAdjustedPrice(comp), 0) / selectedComps.length)
    : 0;

  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    if (onAdjustmentsChange && Object.keys(adjustments).length > 0 && prevValueRef.current !== averageAdjustedPrice) {
      prevValueRef.current = averageAdjustedPrice;
      onAdjustmentsChange(adjustments, averageAdjustedPrice);
    }
  }, [adjustments, averageAdjustedPrice, onAdjustmentsChange]);

  const formatAdjustment = (value: number): string => {
    if (value === 0) return '-';
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatCurrency(value)}`;
  };

  const getAdjustmentColor = (value: number): string => {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-walnut/40 dark:text-cream/30';
  };

  if (selectedComps.length === 0) {
    return null;
  }

  const displayedComps = selectedComps.slice(0, 5);
  const hasMore = selectedComps.length > 5;

  return (
    <div className="card-premium rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-walnut/10 dark:border-gold/10 bg-gradient-to-r from-cream to-ivory dark:from-[#111118] dark:to-[#1a1a24]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-burgundy dark:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <h2 className="font-display text-xl font-semibold text-charcoal dark:text-cream">Price Adjustments</h2>
              <p className="text-xs text-walnut/60 dark:text-cream/40">Adjust comparable prices to match subject property</p>
            </div>
          </div>
          {hasMore && (
            <span className="text-xs font-medium text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
              Showing 5 of {selectedComps.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1a1a24] dark:to-[#111118]">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-walnut/10 dark:border-gold/10">
                <th className="text-left py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Property</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Sale Price</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">
                  <div>Bedroom</div>
                  <div className="font-normal normal-case text-walnut/50 dark:text-cream/30">${(adjValues.bedroom / 1000).toFixed(0)}k/bed</div>
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">
                  <div>Bathroom</div>
                  <div className="font-normal normal-case text-walnut/50 dark:text-cream/30">${(adjValues.bathroom / 1000).toFixed(0)}k/bath</div>
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">
                  <div>Sq Ft</div>
                  <div className="font-normal normal-case text-walnut/50 dark:text-cream/30">${adjValues.sqft}/sqft</div>
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">
                  <div>Age</div>
                  <div className="font-normal normal-case text-walnut/50 dark:text-cream/30">${(adjValues.age / 1000).toFixed(0)}k/yr</div>
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Other</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Net Adj.</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Adjusted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-walnut/5 dark:divide-gold/5">
              {displayedComps.map((comp) => {
                const adj = adjustments[comp.id] || { bedroom: 0, bathroom: 0, sqft: 0, age: 0, other: 0 };
                const totalAdj = getTotalAdjustment(comp);
                const adjustedPrice = getAdjustedPrice(comp);

                return (
                  <tr key={comp.id} className="hover:bg-walnut/5 dark:hover:bg-cream/5 transition-colors">
                    <td className="py-3 px-2">
                      <div className="text-sm font-medium text-charcoal dark:text-cream">{comp.address}</div>
                      <div className="text-xs text-walnut/60 dark:text-cream/40">
                        {comp.bedrooms}bd / {comp.bathrooms}ba · {comp.sqft.toLocaleString()} sf · {comp.yearBuilt}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-sm font-semibold text-charcoal dark:text-cream">
                      {formatCurrency(comp.salePrice)}
                    </td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjustmentColor(adj.bedroom))}>
                      {formatAdjustment(adj.bedroom)}
                    </td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjustmentColor(adj.bathroom))}>
                      {formatAdjustment(adj.bathroom)}
                    </td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjustmentColor(adj.sqft))}>
                      {formatAdjustment(adj.sqft)}
                    </td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjustmentColor(adj.age))}>
                      {formatAdjustment(adj.age)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        value={otherInputs[comp.id] ?? ''}
                        onChange={(e) => handleOtherChange(comp.id, e.target.value)}
                        placeholder="0"
                        className="input-premium w-20 px-2 py-1.5 text-sm text-right rounded-lg"
                      />
                    </td>
                    <td className={cn('py-3 px-2 text-right text-sm font-semibold', getAdjustmentColor(totalAdj))}>
                      {formatAdjustment(totalAdj)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm font-bold text-burgundy dark:text-gold bg-burgundy/5 dark:bg-gold/10 px-2 py-1 rounded-lg">
                        {formatCurrency(adjustedPrice)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {displayedComps.map((comp) => {
            const adj = adjustments[comp.id] || { bedroom: 0, bathroom: 0, sqft: 0, age: 0, other: 0 };
            const totalAdj = getTotalAdjustment(comp);
            const adjustedPrice = getAdjustedPrice(comp);

            return (
              <div key={comp.id} className="border border-walnut/10 dark:border-gold/10 rounded-xl p-4 bg-ivory dark:bg-[#1a1a24]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-charcoal dark:text-cream">{comp.address}</div>
                    <div className="text-xs text-walnut/60 dark:text-cream/40">
                      {comp.bedrooms}bd / {comp.bathrooms}ba · {comp.sqft.toLocaleString()} sf
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-walnut/60 dark:text-cream/40 uppercase tracking-wide">Sale Price</div>
                    <div className="font-semibold text-charcoal dark:text-cream">{formatCurrency(comp.salePrice)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex justify-between bg-walnut/5 dark:bg-cream/5 rounded-lg px-2 py-1.5">
                    <span className="text-walnut/60 dark:text-cream/40">Bedroom:</span>
                    <span className={cn('font-medium', getAdjustmentColor(adj.bedroom))}>{formatAdjustment(adj.bedroom)}</span>
                  </div>
                  <div className="flex justify-between bg-walnut/5 dark:bg-cream/5 rounded-lg px-2 py-1.5">
                    <span className="text-walnut/60 dark:text-cream/40">Bathroom:</span>
                    <span className={cn('font-medium', getAdjustmentColor(adj.bathroom))}>{formatAdjustment(adj.bathroom)}</span>
                  </div>
                  <div className="flex justify-between bg-walnut/5 dark:bg-cream/5 rounded-lg px-2 py-1.5">
                    <span className="text-walnut/60 dark:text-cream/40">Sq Ft:</span>
                    <span className={cn('font-medium', getAdjustmentColor(adj.sqft))}>{formatAdjustment(adj.sqft)}</span>
                  </div>
                  <div className="flex justify-between bg-walnut/5 dark:bg-cream/5 rounded-lg px-2 py-1.5">
                    <span className="text-walnut/60 dark:text-cream/40">Age:</span>
                    <span className={cn('font-medium', getAdjustmentColor(adj.age))}>{formatAdjustment(adj.age)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-walnut/60 dark:text-cream/40">Other:</span>
                  <input
                    type="number"
                    value={otherInputs[comp.id] ?? ''}
                    onChange={(e) => handleOtherChange(comp.id, e.target.value)}
                    placeholder="0"
                    className="input-premium flex-1 px-3 py-1.5 text-sm rounded-lg"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-walnut/10 dark:border-gold/10">
                  <div>
                    <span className="text-sm text-walnut/60 dark:text-cream/40">Net Adjustment: </span>
                    <span className={cn('font-semibold', getAdjustmentColor(totalAdj))}>{formatAdjustment(totalAdj)}</span>
                  </div>
                  <div className="bg-burgundy/5 dark:bg-gold/10 px-3 py-1.5 rounded-lg border border-burgundy/10 dark:border-gold/20">
                    <span className="text-xs text-burgundy dark:text-gold">Adjusted: </span>
                    <span className="font-bold text-burgundy dark:text-gold">{formatCurrency(adjustedPrice)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary - Indicated Value */}
        <div className="mt-8 pt-6 border-t border-walnut/10 dark:border-gold/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-walnut dark:text-cream/60">
              Based on {displayedComps.length} adjusted comparable{displayedComps.length !== 1 ? 's' : ''}
            </div>
            <div className="leather-texture rounded-xl px-8 py-5 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xs font-semibold text-gold-light uppercase tracking-wider mb-1">Indicated Value</div>
                <div className="font-display text-3xl font-bold text-cream">
                  {formatCurrency(averageAdjustedPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
