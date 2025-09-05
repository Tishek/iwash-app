import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'iwash_crash_trace_v1';
const MAX_ITEMS = 800; // zvýšeno pro detailnější trasování pádů
// Types that should write-through immediately to survive sudden native crashes
const IMMEDIATE_TYPES = new Set([
  'error',
  'GlobalError',
  'UnhandledPromiseRejection',
  'warn',
  // kritické akce UI – často těsně před pádem
  'sheet_pan_begin',
  'sheet_pan_end',
  'sheet_snap_start',
  'sheet_snap_end',
  'filter_click',
  'filter_set',
  'filter_transition_start',
  'filter_transition_end',
  'AppState',
  'list_item_press',
  'place_focus_center',
  'place_focus_scroll',
  'marker_press',
  'marker_center',
  'marker_scroll',
  'scroll_to_index_failed',
]);
let buffer = [];
let dirty = false;
let flushTimer = null;
let lastForceFlushTs = 0;

function push(entry) {
  try {
    buffer.push(entry);
    if (buffer.length > MAX_ITEMS) buffer.splice(0, buffer.length - MAX_ITEMS);
    scheduleFlush();
  } catch {}
}

function scheduleFlush() {
  if (flushTimer) return;
  dirty = true;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    if (!dirty) return;
    dirty = false;
    try {
      const payload = JSON.stringify({ ts: Date.now(), items: buffer });
      await AsyncStorage.setItem(KEY, payload);
    } catch {}
  }, 250);
}

export function breadcrumb(type, payload) {
  const ts = new Date().toISOString();
  push({ ts, type, payload });
  // For critical events, write-through immediately to maximize persistence
  if (IMMEDIATE_TYPES.has(type)) {
    const now = Date.now();
    // Rate-limit immediate flushes to avoid I/O storms on iOS
    if (now - lastForceFlushTs > 600) {
      lastForceFlushTs = now;
      forceFlush().catch(() => {});
    } else {
      // fall back to scheduled flush
      scheduleFlush();
    }
  }
}

export async function readTrace() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearTrace() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}

export async function forceFlush() {
  try {
    const payload = JSON.stringify({ ts: Date.now(), items: buffer });
    await AsyncStorage.setItem(KEY, payload);
  } catch {}
}

export default { breadcrumb, readTrace, clearTrace, forceFlush };
