// src/utils/cache.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_PREFIX, CACHE_INDEX_KEY, CACHE_MAX_ENTRIES, CACHE_TTL_MS } from './constants';

function roundCoord(n, decimals = 4) {
  const f = 10 ** decimals;
  return Math.round((n ?? 0) * f) / f;
}

export function makeCacheKey(center, radiusM) {
  if (!center) return null;
  const lat = roundCoord(center.latitude);
  const lng = roundCoord(center.longitude);
  return `${CACHE_PREFIX}:${lat}:${lng}:${radiusM}`;
}

export async function readCache(key) {
  try {
    if (!key) return null;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { items, ts } = parsed;
    if (!Array.isArray(items) || typeof ts !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCache(key, payload) {
  try {
    if (!key) return;
    const now = Date.now();
    const value = JSON.stringify({ ...payload, ts: payload?.ts || now });
    await AsyncStorage.setItem(key, value);
    await updateIndex(key, payload?.ts || now);
  } catch {}
}

async function updateIndex(key, ts) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    let idx = [];
    if (raw) {
      try { idx = JSON.parse(raw) || []; } catch { idx = []; }
    }
    // Remove any existing entry for this key
    idx = idx.filter((e) => e && e.key !== key);
    idx.push({ key, ts: ts || Date.now() });
    // Sort by ts asc, then prune oldest
    idx.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const overflow = Math.max(0, idx.length - CACHE_MAX_ENTRIES);
    const toRemove = overflow > 0 ? idx.slice(0, overflow) : [];
    if (toRemove.length) {
      for (const e of toRemove) {
        try { await AsyncStorage.removeItem(e.key); } catch {}
      }
      idx = idx.slice(overflow);
    }
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
  } catch {}
}

export function isFresh(entry, ttlMs = CACHE_TTL_MS) {
  if (!entry || typeof entry.ts !== 'number') return false;
  return Date.now() - entry.ts <= (ttlMs || CACHE_TTL_MS);
}

