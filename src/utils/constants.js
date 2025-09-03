export const ITEM_H = 112;

export const MIN_M = 500;
export const MAX_M = 5000;
export const STEP_M = 100;
export const MAX_RESULTS = 60;

export const PIN_SELECTED_SCALE = 1.3; // o chlup menší, protože pin je větší
export const PIN_TOP_H = 28;      // odpovídá styles.pinTop
export const PIN_STEM_H = 10;     // odpovídá styles.pinStem borderTopWidth
export const PIN_STEM_MARGIN = 3; // odpovídá styles.pinStem marginTop
export const PIN_ANCHOR_OFFSET_BASE = PIN_STEM_H + PIN_STEM_MARGIN + PIN_TOP_H / 2;

export const TARGET_VISIBLE_SPAN_M = 1000;
export const METERS_PER_DEGREE_LAT = 111320;

export const TYPE_LABEL = {
  CONTACT: 'Kontaktní',
  NONCONTACT: 'Bezkontaktní',
  FULLSERVICE: 'Full service',
  UNKNOWN: 'Neznámé',
};

export const OVERRIDE_FULL = ['kk detail','solid car wash','solid carwash','mobilewash'];
export const OVERRIDE_EXCLUDE = ['auto podbabska','autopodbabska'];

// --- App settings defaults & storage keys ---
export const DEFAULT_SETTINGS = {
  autoReload: false,
  defaultRadiusM: 1500,
  searchFrom: 'myLocation', // 'myLocation' | 'mapCenter'
  theme: 'system',          // 'system' | 'light' | 'dark'
  preferredNav: 'ask',      // 'ask' | 'apple' | 'google' | 'waze'
  useCache: true,           // offline cache toggle
  cacheTtlMin: 20,          // TTL v minutách
};

export const SETTINGS_KEY = 'iwash_settings_v1';
export const FAVORITES_KEY = 'iwash_favorites_v1';
export const FAVORITES_DATA_KEY = 'iwash_favorites_data_v1';
export const MAX_FAVORITES = 3;

// --- Offline cache ---
export const CACHE_ENABLED = true;
export const CACHE_PREFIX = 'iwash_cache_v1';
export const CACHE_INDEX_KEY = 'iwash_cache_index_v1';
export const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
export const CACHE_MAX_ENTRIES = 30;
