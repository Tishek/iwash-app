// src/services/places.js
import { inferType } from '../utils/inferType';
import { normalizeStr } from '../utils/text';
import { OVERRIDE_EXCLUDE, OVERRIDE_FULL, MAX_RESULTS } from '../utils/constants';
import { distanceMeters } from '../utils/geo';
import { GOOGLE_MAPS_API_KEY } from '../utils/config';

export async function fetchNearbyCarWashes({ searchCenter, radiusM, apiKey }) {
  if (!apiKey) throw new Error('Google Maps API key missing');
  if (!searchCenter) return [];

  const base = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
  const acc = [];
  let pageToken = null;
  let safety = 0;

  const mapPlace = (p) => {
    const loc = {
      latitude: p.geometry?.location?.lat ?? 0,
      longitude: p.geometry?.location?.lng ?? 0,
    };
    const address = p.vicinity || p.formatted_address || '';
    const inferredBase = inferType(p.name, p.types, address);

    const n = normalizeStr(p.name).toLowerCase();
    const a = normalizeStr(address).toLowerCase();

    if (OVERRIDE_EXCLUDE.some((k) => n.includes(k) || a.includes(k))) return null;

    const inferred = OVERRIDE_FULL.some((k) => n.includes(k) || a.includes(k))
      ? 'FULLSERVICE'
      : inferredBase;

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
      openNow:
        p.opening_hours && typeof p.opening_hours.open_now === 'boolean'
          ? p.opening_hours.open_now
          : null,
    };
  };

  try {
    do {
      const url = pageToken
        ? `${base}?pagetoken=${pageToken}&key=${apiKey}`
        : `${base}?location=${searchCenter.latitude},${searchCenter.longitude}&radius=${radiusM}&type=car_wash&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        throw new Error(json.error_message || json.status || 'Places API error');
      }

      const pageItems = (json.results || []).map(mapPlace).filter(Boolean);

      // merge by place_id
      for (const it of pageItems) {
        if (!acc.some((x) => x.id === it.id)) acc.push(it);
      }

      pageToken =
        json.next_page_token && acc.length < MAX_RESULTS ? json.next_page_token : null;

      if (pageToken) {
        await new Promise((r) => setTimeout(r, 2000));
      }
      safety++;
    } while (pageToken && acc.length < MAX_RESULTS && safety < 5);
  } catch (e) {
    throw new Error(String(e?.message ?? e));
  }

  return acc.sort((a, b) => a.distanceM - b.distanceM);
}