import { inferType } from '../utils/inferType';
import { normalizeStr } from '../utils/text';
import { OVERRIDE_EXCLUDE, OVERRIDE_FULL, MAX_RESULTS } from '../utils/constants';
import { distanceMeters } from '../utils/geo';
import { EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } from '../utils/config';


const API_KEY = EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Dev-only connectivity preflight (runs once per app session)
const __DEV_PREFLIGHT__ = { done: false };

async function fetchWithTimeout(url, ms) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), ms) : null;
  try {
    const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (timer) clearTimeout(timer);
    return res;
  } catch (e) {
    if (timer) clearTimeout(timer);
    throw e;
  }
}

async function devPreflightConnectivity() {
  if (__DEV_PREFLIGHT__.done || !__DEV__) return;
  try {
    // 1) Basic HTTPS reachability
    const r1 = await fetchWithTimeout('https://jsonplaceholder.typicode.com/todos/1', 8000);
    if (!r1.ok) {
      throw new Error(`Dev preflight: basic HTTPS fetch failed (HTTP ${r1.status})`);
    }
    // 2) Google APIs reachability (ATS/proxy/DNS issues often show here)
    const r2 = await fetchWithTimeout('https://maps.googleapis.com/generate_204', 8000);
    if (r2.status !== 204 && r2.status !== 200) {
      throw new Error(`Dev preflight: googleapis fetch returned HTTP ${r2.status}`);
    }
    try { console.log('[places] dev preflight OK'); } catch {}
  } catch (e) {
    try { console.warn('[places] dev preflight FAILED →', e?.message || e); } catch {}
    // Surface a clearer message to the UI so we don't just show "Network request failed"
    throw new Error(
      `Network unreachable in simulator: ${e?.message || e}. ` +
      'Check macOS network, VPN/proxy, or simulator connectivity. If on corporate Wi‑Fi, try a different network.'
    );
  } finally {
    __DEV_PREFLIGHT__.done = true;
  }
}

export async function fetchNearbyCarWashes({ searchCenter, radiusM }) {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY missing');
  if (!searchCenter) return [];
  // Dev-only: verify connectivity once, to provide better diagnostics than a generic network error
  await devPreflightConnectivity();

  const base = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
  const acc = [];
  let pageToken = null;
  let safety = 0;

  const FETCH_TIMEOUT_MS = 15000;

  const maskKey = (u) => (typeof u === 'string' ? u.replace(API_KEY, '***') : u);

  const mapPlace = (p) => {
    const loc = { latitude: p.geometry?.location?.lat ?? 0, longitude: p.geometry?.location?.lng ?? 0 };
    const address = p.vicinity || p.formatted_address || '';
    const inferredBase = inferType(p.name, p.types, address);

    const n = normalizeStr(p.name).toLowerCase();
    const a = normalizeStr(address).toLowerCase();

    if (OVERRIDE_EXCLUDE.some(k => n.includes(k) || a.includes(k))) return null;

    const inferred = OVERRIDE_FULL.some(k => n.includes(k) || a.includes(k)) ? 'FULLSERVICE' : inferredBase;

    return {
      id: p.place_id,
      name: p.name,
      address,
      location: loc,
      distanceM: Math.round(distanceMeters(searchCenter, loc)),
      types: p.types || [],
      rating: p.rating,
      userRatingsTotal: p.user_ratings_total,
      inferredType: inferred,
      openNow: (p.opening_hours && typeof p.opening_hours.open_now === 'boolean') ? p.opening_hours.open_now : null,
    };
  };

  do {
    const url = pageToken
      ? `${base}?pagetoken=${pageToken}&key=${API_KEY}`
      : `${base}?location=${searchCenter.latitude},${searchCenter.longitude}&radius=${radiusM}&type=car_wash&key=${API_KEY}`;

    // DEBUG/diagnostics (bez vyzrazení klíče)
    try {
      console.log('[places] nearbysearch →', {
        lat: searchCenter.latitude,
        lng: searchCenter.longitude,
        radiusM,
        pageToken: !!pageToken,
        url: maskKey(url),
      });
    } catch {}

    // Timeout a síťové chyby
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS) : null;

    let res;
    try {
      res = await fetch(url, controller ? { signal: controller.signal } : undefined);
    } catch (err) {
      if (timer) clearTimeout(timer);
      throw new Error(`Network error while fetching Places: ${err?.message || err}`);
    }
    if (timer) clearTimeout(timer);

    if (!res.ok) {
      let text = '';
      try { text = await res.text(); } catch {}
      const snippet = text ? text.slice(0, 200) : '';
      throw new Error(`Places HTTP ${res.status} ${res.statusText || ''}${snippet ? ` – ${snippet}` : ''}`);
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error('Failed to parse Places JSON');
    }

    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      const em = json?.error_message ? ` – ${json.error_message}` : '';
      throw new Error(`Places API error: ${json.status}${em}`);
    }

    const pageItems = (json.results || []).map(mapPlace).filter(Boolean);

    // merge by place_id
    for (const it of pageItems) {
      if (!acc.some(x => x.id === it.id)) acc.push(it);
    }

    pageToken = json.next_page_token && acc.length < MAX_RESULTS ? json.next_page_token : null;

    if (pageToken) {
      await new Promise(r => setTimeout(r, 2000));
    }
    safety++;
  } while (pageToken && acc.length < MAX_RESULTS && safety < 5);

  return acc.sort((a, b) => a.distanceM - b.distanceM);
}
