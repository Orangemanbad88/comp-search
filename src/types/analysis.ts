import { SubjectProperty, CompResult, SearchMode } from './property';
import { CompAdjustments } from '@/components/property/AdjustmentGrid';

export interface SavedAnalysis {
  id: string;
  name: string;
  savedAt: string;
  subject: SubjectProperty;
  selectedComps: CompResult[];
  adjustments: CompAdjustments;
  indicatedValue: number;
  searchMode: SearchMode;
}
