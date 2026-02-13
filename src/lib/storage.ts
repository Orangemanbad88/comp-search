import { SavedAnalysis } from '@/types/analysis';
import { SubjectProperty, CompResult, SearchMode } from '@/types/property';
import { CompAdjustments } from '@/components/property/AdjustmentGrid';

const STORAGE_KEY = 'compAtlas_savedAnalyses';

export const getSavedAnalyses = (): SavedAnalysis[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAnalysis = (data: {
  name: string;
  subject: SubjectProperty;
  selectedComps: CompResult[];
  adjustments: CompAdjustments;
  indicatedValue: number;
  searchMode: SearchMode;
}): SavedAnalysis => {
  const analysis: SavedAnalysis = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...data,
  };
  const existing = getSavedAnalyses();
  existing.unshift(analysis);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return analysis;
};

export const getAnalysis = (id: string): SavedAnalysis | null => {
  const analyses = getSavedAnalyses();
  return analyses.find(a => a.id === id) ?? null;
};

export const deleteAnalysis = (id: string): void => {
  const analyses = getSavedAnalyses();
  const filtered = analyses.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
