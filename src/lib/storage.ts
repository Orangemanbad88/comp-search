import { SavedAnalysis } from '@/types/analysis';
import { SubjectProperty, CompResult, SearchMode } from '@/types/property';
import { CompAdjustments } from '@/components/property/AdjustmentGrid';
import {
  MlsProviderConfig,
  AdjustmentProfile,
  SaleAdjustmentValues,
  SearchPreferences,
  DEFAULT_SALE_ADJUSTMENTS,
  DEFAULT_SEARCH_PREFERENCES,
} from '@/types/settings';

const STORAGE_KEY = 'compAtlas_savedAnalyses';
const INTEGRATION_KEY = 'compAtlas_integration';
const PROFILES_KEY = 'compAtlas_adjustmentProfiles';
const ACTIVE_PROFILE_KEY = 'compAtlas_activeProfileId';
const PREFERENCES_KEY = 'compAtlas_searchPreferences';

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

// --- Integration Config ---

export const getIntegrationConfig = (): MlsProviderConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(INTEGRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveIntegrationConfig = (config: MlsProviderConfig): void => {
  localStorage.setItem(INTEGRATION_KEY, JSON.stringify(config));
};

export const clearIntegrationConfig = (): void => {
  localStorage.removeItem(INTEGRATION_KEY);
};

// --- Adjustment Profiles ---

export const getAdjustmentProfiles = (): AdjustmentProfile[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAdjustmentProfile = (profile: AdjustmentProfile): void => {
  const profiles = getAdjustmentProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const deleteAdjustmentProfile = (id: string): void => {
  const profiles = getAdjustmentProfiles().filter(p => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  if (getActiveProfileId() === id) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
};

export const getActiveProfileId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
};

export const setActiveProfileId = (id: string | null): void => {
  if (id) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
};

export const getActiveAdjustmentValues = (): SaleAdjustmentValues => {
  if (typeof window === 'undefined') return DEFAULT_SALE_ADJUSTMENTS;
  const profileId = getActiveProfileId();
  if (!profileId) return DEFAULT_SALE_ADJUSTMENTS;

  const profiles = getAdjustmentProfiles();
  const profile = profiles.find(p => p.id === profileId);
  return profile?.values ?? DEFAULT_SALE_ADJUSTMENTS;
};

// --- Search Preferences ---

export const getSearchPreferences = (): SearchPreferences => {
  if (typeof window === 'undefined') return DEFAULT_SEARCH_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SEARCH_PREFERENCES;
  } catch {
    return DEFAULT_SEARCH_PREFERENCES;
  }
};

export const saveSearchPreferences = (prefs: SearchPreferences): void => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
};
