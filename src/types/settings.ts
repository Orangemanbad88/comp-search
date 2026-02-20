export interface MlsProviderConfig {
  provider: MlsProvider;
  credentials: Record<string, string>;
  fieldMapping?: Record<string, string>;
  lastTested?: string;
  testStatus?: 'success' | 'error' | 'untested';
}

export type MlsProvider =
  | 'simplyrets'
  | 'bridgeinteractive'
  | 'sparkapi'
  | 'crmls'
  | 'custom';

export interface MlsProviderMeta {
  id: MlsProvider;
  name: string;
  description: string;
  credentialFields: CredentialField[];
  docsUrl: string;
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
}

export const MLS_PROVIDERS: MlsProviderMeta[] = [
  {
    id: 'simplyrets',
    name: 'SimplyRETS',
    description: 'Simple MLS API with wide coverage',
    credentialFields: [
      { key: 'username', label: 'API Username', type: 'text', placeholder: 'simplyrets', required: true },
      { key: 'password', label: 'API Password', type: 'password', placeholder: 'simplyrets', required: true },
    ],
    docsUrl: 'https://docs.simplyrets.com',
  },
  {
    id: 'bridgeinteractive',
    name: 'Bridge Interactive',
    description: 'RESO Web API compliant data platform',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Bridge API key', required: true },
      { key: 'serverUrl', label: 'Server URL', type: 'url', placeholder: 'https://api.bridgedataoutput.com', required: true },
    ],
    docsUrl: 'https://bridgedataoutput.com/docs',
  },
  {
    id: 'sparkapi',
    name: 'Spark API',
    description: 'FBS Spark API for Flexmls',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Spark API key', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Your Spark API secret', required: true },
    ],
    docsUrl: 'https://sparkplatform.com/docs',
  },
  {
    id: 'crmls',
    name: 'CRMLS',
    description: 'California Regional MLS',
    credentialFields: [
      { key: 'loginUrl', label: 'RETS Login URL', type: 'url', placeholder: 'https://rets.crmls.org/...', required: true },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'Your CRMLS username', required: true },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Your CRMLS password', required: true },
    ],
    docsUrl: 'https://crmls.org',
  },
  {
    id: 'custom',
    name: 'Custom / Other MLS',
    description: 'Configure any RETS or Web API endpoint',
    credentialFields: [
      { key: 'baseUrl', label: 'Base URL', type: 'url', placeholder: 'https://api.yourmls.com', required: true },
      { key: 'apiKey', label: 'API Key / Token', type: 'password', placeholder: 'Your API key or bearer token', required: true },
    ],
    docsUrl: '',
  },
];

export interface AdjustmentProfile {
  id: string;
  name: string;
  isPreset: boolean;
  values: SaleAdjustmentValues;
}

export interface SaleAdjustmentValues {
  bedroom: number;
  bathroom: number;
  sqft: number;
  age: number;
}

export interface SearchPreferences {
  defaultRadius: 0.5 | 1 | 2 | 5;
  defaultTimeframe: 3 | 6 | 12;
  defaultBedVariance: number;
  defaultBathVariance: number;
  defaultSqftVariance: number;
}

export const DEFAULT_SALE_ADJUSTMENTS: SaleAdjustmentValues = {
  bedroom: 25000,
  bathroom: 15000,
  sqft: 150,
  age: 3000,
};

export const SALE_ADJUSTMENT_PRESETS: AdjustmentProfile[] = [
  {
    id: 'shore-nj',
    name: 'Shore Market (Cape May, NJ)',
    isPreset: true,
    values: { bedroom: 25000, bathroom: 15000, sqft: 150, age: 3000 },
  },
  {
    id: 'suburban-mid',
    name: 'Suburban (Mid-Atlantic)',
    isPreset: true,
    values: { bedroom: 20000, bathroom: 12000, sqft: 125, age: 2500 },
  },
  {
    id: 'urban-northeast',
    name: 'Urban (Northeast)',
    isPreset: true,
    values: { bedroom: 35000, bathroom: 20000, sqft: 200, age: 4000 },
  },
  {
    id: 'rural',
    name: 'Rural / Low-Cost Market',
    isPreset: true,
    values: { bedroom: 10000, bathroom: 7500, sqft: 75, age: 1500 },
  },
];

export const DEFAULT_SEARCH_PREFERENCES: SearchPreferences = {
  defaultRadius: 2,
  defaultTimeframe: 6,
  defaultBedVariance: 1,
  defaultBathVariance: 1,
  defaultSqftVariance: 20,
};
