import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'iwash_crash_trace_v1';
const MAX_ITEMS = 120;
let buffer = [];
let dirty = false;
let flushTimer = null;

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

