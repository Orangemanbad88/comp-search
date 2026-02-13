'use client';

import { useState } from 'react';
import { SubjectProperty, CompResult, SearchMode } from '@/types/property';
import { CompAdjustments } from '@/components/property/AdjustmentGrid';
import { saveAnalysis } from '@/lib/storage';

interface SaveAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  subject: SubjectProperty;
  selectedComps: CompResult[];
  adjustments: CompAdjustments;
  indicatedValue: number;
  searchMode: SearchMode;
}

export const SaveAnalysisDialog = ({
  isOpen,
  onClose,
  onSaved,
  subject,
  selectedComps,
  adjustments,
  indicatedValue,
  searchMode,
}: SaveAnalysisDialogProps) => {
  const [name, setName] = useState(subject.address);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSave = () => {
    saveAnalysis({
      name: name.trim() || subject.address,
      subject,
      selectedComps,
      adjustments,
      indicatedValue,
      searchMode,
    });
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="card-premium rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-walnut/10 dark:border-gold/20">
        {/* Header */}
        <div className="leather-texture px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-cream relative z-10 flex items-center gap-2">
            <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save Analysis
          </h2>
          <button
            onClick={onClose}
            className="relative z-10 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-cream/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-walnut dark:text-cream/70 mb-1">Analysis Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-premium w-full px-3 py-2 rounded-lg text-charcoal dark:text-cream dark:bg-[#1a1a24] dark:border-gold/20"
              placeholder="e.g. 123 Main St Analysis"
              autoFocus
            />
          </div>

          <div className="bg-walnut/5 dark:bg-gold/5 rounded-lg p-4 space-y-2 border border-walnut/10 dark:border-gold/10">
            <div className="flex justify-between text-sm">
              <span className="text-walnut/70 dark:text-cream/50">Subject</span>
              <span className="text-charcoal dark:text-cream font-medium">{subject.address}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-walnut/70 dark:text-cream/50">Comps Selected</span>
              <span className="text-charcoal dark:text-cream font-medium">{selectedComps.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-walnut/70 dark:text-cream/50">Indicated Value</span>
              <span className="text-charcoal dark:text-cream font-medium font-display">${indicatedValue.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-walnut/20 dark:border-gold/20 text-walnut dark:text-cream/70 hover:bg-walnut/5 dark:hover:bg-gold/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-premium px-4 py-2.5 rounded-lg text-sm font-semibold"
            >
              Save Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
