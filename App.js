// App.js
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Dimensions, Alert, Linking, LogBox, AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { openNavigationTo } from './src/utils/navigation';
import {
  MIN_M, MAX_M, STEP_M,
  PIN_ANCHOR_OFFSET_BASE,
  TARGET_VISIBLE_SPAN_M,
} from './src/utils/constants';

import { useSettings } from './src/hooks/useSettings';
import { useFavorites } from './src/hooks/useFavorites';
import SettingsContainer from './src/components/SettingsContainer';
import MainMapView from './src/components/MainMapView';
import SearchControls from './src/components/SearchControls';
import { createTranslator } from './src/i18n/strings';
import BottomSheetContainer from './src/components/BottomSheetContainer';
import { appStyles } from './src/styles/appStyles';
import { useClustering } from './src/hooks/useClustering';
import { usePinSelection } from './src/hooks/usePinSelection';
import { useLocationFollow } from './src/hooks/useLocationFollow';
import { useVisibleCentering } from './src/hooks/useVisibleCentering';
import { useThemePalette } from './src/hooks/useThemePalette';
import { useBottomSheet } from './src/hooks/useBottomSheet';
import { useRadius } from './src/hooks/useRadius';
import { useFilteredPlaces } from './src/hooks/useFilteredPlaces';
import { useAuraPulse } from './src/hooks/useAuraPulse';
import { useClusterRadiusPx } from './src/hooks/useClusterRadiusPx';
import { DEV_LOG } from './src/utils/devlog';
import { usePlacesSearch } from './src/hooks/usePlacesSearch';
import { usePlaceFocus } from './src/hooks/usePlaceFocus';
import { useTopOcclusion } from './src/hooks/useTopOcclusion';
import { useSearchControls } from './src/hooks/useSearchControls';
import { DebugProvider } from './src/debug/DebugProvider';
import DebugOverlay from './src/debug/DebugOverlay';
import CrashBanner from './src/components/CrashBanner';
import { readTrace, clearTrace, breadcrumb } from './src/utils/crashTrace';
import ErrorBoundary from './src/components/ErrorBoundary.jsx';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Global JS error handler – log as ERROR even když overlay není otevřený
try {
  // eslint-disable-next-line no-undef
  const orig = global.ErrorUtils?.getGlobalHandler?.();
  // eslint-disable-next-line no-undef
  global.ErrorUtils?.setGlobalHandler?.((err, isFatal) => {
    try { console.error('[GlobalError]', isFatal ? 'FATAL' : 'non-fatal', err); } catch {}
    try { breadcrumb('GlobalError', { message: String(err?.message || err), stack: String(err?.stack || ''), isFatal }); } catch {}
    if (typeof orig === 'function') { try { orig(err, isFatal); } catch {} }
  });
} catch {}

// Zachytí neodchycené Promise rejections (často chybí v console.error)
try {
  const logRejection = (e) => {
    try { console.error('[UnhandledPromiseRejection]', e?.reason ?? e); } catch {}
    try { breadcrumb('UnhandledPromiseRejection', { reason: String(e?.reason ?? e), stack: String(e?.reason?.stack || e?.stack || '') }); } catch {}
  };
  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('unhandledrejection', logRejection);
  }
} catch {}

LogBox.ignoreLogs(['No cluster with the specified id', 'No region provided!']);

function AppInner() {
  const mapRef = useRef(null);
  const listRef = useRef(null);
  const pendingFocusCoordRef = useRef(null);
  const pendingFocusScaleRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const animTimerRef = useRef(null);

  const animateToRegionSafe = useCallback((r, d = 280) => {
    if (!mapRef.current) return;
    isAnimatingRef.current = true;
    try { mapRef.current.animateToRegion(r, d); } catch {}
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => { isAnimatingRef.current = false; }, d + 80);
  }, []);

  const { settings, saveSettings } = useSettings();

  const lang = settings?.lang === 'en' ? 'en' : 'cs';
  const t = createTranslator(lang);

  const insets = useSafeAreaInsets();
  const clusterZoomingRef = useRef(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSheetAnimating, setIsSheetAnimating] = useState(false);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
  const [clusterHold, setClusterHold] = useState(false);
  const mapPlacesRef = useRef([]);
  const lastUiActionRef = useRef({ type: null, ts: 0, payload: null });

  // Vypiš logy z minulé session (pokud app předtím spadla) a pak je smaž
  const [crashReport, setCrashReport] = useState(null);
  useEffect(() => {
    try { breadcrumb('AppMount', {}); } catch {}
    (async () => {
      try {
        const trace = await readTrace();
        if (trace?.items?.length) {
          console.warn('[LastSessionTrace]', trace.items.length, 'events, last ts:', new Date(trace.ts).toISOString());
          trace.items.forEach((it) => console.warn(`[trace:${it.type}]`, it.ts, it.payload));
          // Build a short report for in-app banner
          try {
            const last = trace.items[trace.items.length - 1];
            const prev = trace.items[trace.items.length - 2];
            const likely = prev?.type && last?.type ? `${prev.type} → ${last.type}` : (last?.type || '');
            // Sestav posledních pár významných eventů (error/warn/*_press/*_center/*_scroll)
            const lines = trace.items
              .slice(-12)
              .map((it) => {
                const p = typeof it.payload === 'string' ? it.payload : JSON.stringify(it.payload || {});
                return `${new Date(it.ts).toLocaleTimeString()} • ${it.type}${p ? ` — ${p}` : ''}`;
              });
            setCrashReport({ title: 'Aplikace byla minule ukončena', detail: `Poslední události: ${likely}`, list: lines });
          } catch {}
          await clearTrace();
        } else {
          // Make it explicit when there was nothing to read (helps debugging)
          console.warn('[LastSessionTrace] none');
        }
      } catch {
        try { console.warn('[LastSessionTrace] read failed'); } catch {}
      }
    })();
    return () => { try { breadcrumb('AppUnmount', {}); } catch {} };
  }, []);

  // Při odchodu do pozadí/neaktivity loguj AppState + perzistuj trace
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      try { breadcrumb('AppState', { state: s, lastAction: lastUiActionRef.current }); } catch {}
      if (s === 'background' || s === 'inactive') {
        try { require('./src/utils/crashTrace').forceFlush?.(); } catch {}
      }
    });
    return () => { try { sub?.remove?.(); } catch {} };
  }, []);

  const {
    hasPermission, region, setRegion, coords, followMe, setFollowMe, disableFollow, recenter
  } = useLocationFollow({
    animateToRegionSafe,
    initialRegionFallback: {
      latitude: 50.087465, longitude: 14.421254, latitudeDelta: 0.05, longitudeDelta: 0.05
    },
  });

  const { topUiBottomY, registerTopOcclusion } = useTopOcclusion();

  const regionRef = useRef(region); // Inicializace ref s aktuálním region pro prevenci ReferenceError při přístupu k properties
  useEffect(() => { regionRef.current = region; }, [region]);

  const { radiusM, setRadiusM, commitRadius, adjustRadius } = useRadius(settings, saveSettings);

  const {
    places, setPlaces, loading, lastError, setLastError, autoReloadTimerRef, searchHere,
    fromCache, cacheTs,
  } = usePlacesSearch({
    t,
    settings,
    coords,
    radiusM,
    searchCenter: null,
    autoReload: false,
    isSheetAnimating: isSheetAnimating,
  });

  const [filterMode, setFilterMode] = useState('ALL');
  const { favorites, favoritesData, isFav, toggleFav } = useFavorites();

  const searchCenter = useMemo(() => {
    if (settings.searchFrom === 'myLocation' && coords)
      return { latitude: coords.latitude, longitude: coords.longitude };
    if (region)
      return { latitude: region.latitude, longitude: region.longitude };
    return null;
  }, [settings.searchFrom, coords, region]);

  const { filteredPlaces, selectedId, setSelectedId, idToIndex } = useFilteredPlaces({
    places,
    filterMode,
    isFav,
    favoritesData,
    searchCenter,
  });

  // Map vrstva dostává stabilní sadu míst během přepínání filtru
  useEffect(() => {
    if (!isFilterTransitioning) {
      mapPlacesRef.current = filteredPlaces;
    }
  }, [filteredPlaces, isFilterTransitioning]);

  // Jednotný zdroj míst pro mapu i clustering během přechodu filtru
  const filteredPlacesForMap = isFilterTransitioning ? mapPlacesRef.current : filteredPlaces;

  const { getPinScale } = usePinSelection(selectedId);
  const { ringScale, ringOpacity } = useAuraPulse();
  const { isDark, P } = useThemePalette(settings.theme);
  const clusterRadiusPx = useClusterRadiusPx(region);

  const { isExpanded, setIsExpanded, sheetH, sheetTopH, setSheetTopH, sheetTop, setSheetTopY } = useBottomSheet({
    onAtTargetHeight: () => {
      if (pendingFocusCoordRef.current) {
        const coord = pendingFocusCoordRef.current;
        const scale = (pendingFocusScaleRef.current ?? 0);
        requestAnimationFrame(() => {
          moveMarkerToVisibleCenter(coord, {
            zoomFactor: 0.7,
            minDelta: 0.01,
            pinScale: scale,
            targetSpanM: TARGET_VISIBLE_SPAN_M,
          });
          pendingFocusCoordRef.current = null;
          pendingFocusScaleRef.current = 0;
        });
      }
    },
    collapsedH: 110,
    expandedMaxH: Math.min(420, SCREEN_H * 0.6),
  });

  // Keep a stable ref to setIsExpanded so callbacks never see it as undefined
  const setIsExpandedRef = useRef(null);
  useEffect(() => {
    setIsExpandedRef.current = setIsExpanded;
  }, [setIsExpanded]);

  const { moveMarkerToVisibleCenter, centerLockRef } = useVisibleCentering({
    insets,
    topUiBottomY,
    sheetTop,
    screen: { width: SCREEN_W, height: SCREEN_H },
    region,
    regionRef,
    isExpanded,
    animateToRegionSafe,
    pinAnchorOffsetBase: PIN_ANCHOR_OFFSET_BASE,
  });

  // Bezpečný „expand po hledání“ – volá vždy aktuální setter z ref (žádné warny)
  const onSearchBeforeExpand = useCallback((focusCoord) => {
    pendingFocusCoordRef.current = focusCoord;
    pendingFocusScaleRef.current = 0;
    const fn = setIsExpandedRef.current;
    if (typeof fn === 'function') fn(true);
  }, []);

  const triggerSearch = useCallback(() => {
    if (!searchCenter) return;
    // spustí hledání a po dokončení rozšíří sheet (viz onSearchBeforeExpand)
    searchHere(searchCenter, onSearchBeforeExpand);
  }, [searchHere, searchCenter, onSearchBeforeExpand]);

  const openNavigation = async (item, app) =>
    openNavigationTo(item, app, t, Linking, Alert);

  const onNavigatePreferred = (item) => {
    const app = settings.preferredNav || 'google';
    openNavigation(item, app);
  };

  const { focusPlace, onMarkerPress } = usePlaceFocus({
    selectedId,
    setSelectedId,
    isExpanded,
    setIsExpanded,
    idToIndex,
    listRef,
    sheetTopH,
    moveMarkerToVisibleCenter,
    disableFollow,
    pendingFocusCoordRef,
    pendingFocusScaleRef,
    onFocusStart: () => setIsFocusing(true),
    onFocusEnd: () => setIsFocusing(false),
  });

  const {
    getClusterEdgePadding,
    progressiveClusterZoom,
    collectCoordsFromBBox
  } = useClustering({
    insets,
    topUiBottomY,
    isExpanded,
    sheetTop,
    screen: { width: SCREEN_W, height: SCREEN_H },
    regionRef,
    region,
    clusterRadiusPx,
    filteredPlaces: filteredPlacesForMap,
    moveMarkerToVisibleCenter,
    centerLockRef,
  });

  // dovolí posílat clusterId + extra kontext (i když ho teď nepoužíváme)
  const progressiveClusterZoomWrapped = async (center, clusterId, extra) => {
    if (!center || !mapRef.current) return;
    if (clusterZoomingRef.current) return;
    clusterZoomingRef.current = true;
    disableFollow();
    try { Haptics.selectionAsync(); } catch {}
    try { await progressiveClusterZoom(center, clusterId, extra); }
    finally { clusterZoomingRef.current = false; }
  };

  const collectCoordsFromBBoxWrapped = (center) => collectCoordsFromBBox(center);

  const controls = useSearchControls({
    t,
    settings,
    recenter,
    adjustRadius,
    commitRadius,
    setSettingsOpen,
    onSearch: triggerSearch,
  });

  const { toggleOverlay } =
    (function useMaybeDebug() { try { return useDebug() || {}; } catch { return {}; } })();

  // Signály pro bezpečné přepínání filtru (mapu dočasně zmrazíme)
  const onFilterChangeStart = useCallback((key) => {
    const ts = Date.now();
    try { breadcrumb('filter_transition_start', { key, ts }); } catch {}
    lastUiActionRef.current = { type: 'filter_transition_start', ts, payload: key };
    setIsFilterTransitioning(true);
    setClusterHold(true);
  }, []);

  const onFilterChangeEnd = useCallback((key) => {
    // necháme ještě proběhnout případné animace/layouty
    setTimeout(() => {
      const ts = Date.now();
      try { breadcrumb('filter_transition_end', { key, ts }); } catch {}
      lastUiActionRef.current = { type: 'filter_transition_end', ts, payload: key };
      setIsFilterTransitioning(false);
      // podrž clustering ještě krátce po změně filtru (iOS stabilita)
      setTimeout(() => setClusterHold(false), 500);
    }, 0);
  }, []);

  // Callbacks z BottomSheetu – pro pauzu fetchů a centrování po snapu
  const onSheetSnapStart = useCallback(() => {
    try { console.warn('[sheet] snap start'); } catch {}
    try { breadcrumb('sheet_snap_start', {}); } catch {}
    // Defer state update to avoid re-entrancy from RNGH/reanimated callbacks
    setTimeout(() => { try { setIsSheetAnimating(true); } catch {} }, 0);
  }, []);

  const onSheetSnapEnd = useCallback(({ name, targetPx, topY } = {}) => {
    // Defer state update to avoid re-entrancy from UI thread callback
    setTimeout(() => { try { setIsSheetAnimating(false); } catch {} }, 0);
    try { console.warn('[sheet] snap end ->', name, Math.round(targetPx || 0), 'topY:', Math.round(topY || 0)); } catch {}
    try { breadcrumb('sheet_snap_end', { name, targetPx, topY }); } catch {}
    // Pokud čeká centrování na první klik, proveď ho nyní
    const coord = pendingFocusCoordRef.current;
    const scale = (pendingFocusScaleRef.current ?? 0);
    if (coord) {
      requestAnimationFrame(() => {
        moveMarkerToVisibleCenter(coord, {
          zoomFactor: 0.7,
          minDelta: 0.01,
          pinScale: scale,
          targetSpanM: TARGET_VISIBLE_SPAN_M,
        });
        pendingFocusCoordRef.current = null;
        pendingFocusScaleRef.current = 0;
      });
    }
  }, [moveMarkerToVisibleCenter]);

  return (
    <View style={[styles.container, { backgroundColor: P.bg }]}>
      <MainMapView
        mapRef={mapRef}
        region={region}
        onRegionChangeComplete={(r) => {
          if (isAnimatingRef.current) return;
          const prev = regionRef.current;
          if (prev) {
            const dLat  = Math.abs((prev.latitude ?? 0)       - (r.latitude ?? 0));
            const dLon  = Math.abs((prev.longitude ?? 0)      - (r.longitude ?? 0));
            const dLatD = Math.abs((prev.latitudeDelta ?? 0)  - (r.latitudeDelta ?? 0));
            const dLonD = Math.abs((prev.longitudeDelta ?? 0) - (r.longitudeDelta ?? 0));
            if (dLat < 1e-7 && dLon < 1e-7 && dLatD < 1e-7 && dLonD < 1e-7) return;
          }
          setRegion(r);
        }}
        onPanDrag={() => { disableFollow(); }}
        clusterRadiusPx={clusterRadiusPx}
        searchCenter={searchCenter}
        radiusM={radiusM}
        filteredPlaces={filteredPlacesForMap}
        selectedId={selectedId}
        onMarkerPress={onMarkerPress}
        getPinScale={getPinScale}
        isFav={isFav}
        coords={coords}
        ringScale={ringScale}
        ringOpacity={ringOpacity}
        styles={styles}
        disableFollow={disableFollow}
        getClusterEdgePadding={getClusterEdgePadding}
        collectCoordsFromBBoxWrapped={collectCoordsFromBBoxWrapped}
        progressiveClusterZoomWrapped={progressiveClusterZoomWrapped}
        regionRef={regionRef}
        showCrosshair={settings.searchFrom === 'mapCenter'}
        // jen abychom viděli, že se onMapReady volá (MapViewClustered loguje engine sám)
        onMapReady={() => DEV_LOG('🗺️  map ready')}
        log={(...args) => DEV_LOG('🟣 [renderCluster]', ...args)}
        clusteringEnabled={!isFilterTransitioning && !clusterHold && !isFocusing}
        suspendMarkers={isFilterTransitioning || isFocusing}
      />

      {crashReport && (
        <CrashBanner report={crashReport} onClose={() => setCrashReport(null)} />
      )}

      <SearchControls
        isExpanded={isExpanded}
        isDark={isDark}
        P={P}
        loading={loading}
        t={t}
        styles={styles}
        onTopLayout={registerTopOcclusion}
        onOpenSettings={controls.openSettings}
        onBrandLongPress={toggleOverlay}
        radiusM={radiusM}
        onAdjustRadius={controls.onAdjustRadius}
        onSearchPress={controls.onSearchPress}
        onRecenter={controls.onRecenter}
        onCommitRadius={controls.onCommitRadius}
      />

      <BottomSheetContainer
        styles={styles}
        P={P}
        isDark={isDark}
        t={t}
        onSnapStart={onSheetSnapStart}
        onSnapEnd={onSheetSnapEnd}
        sheetH={sheetH}
        setSheetTopH={setSheetTopH}
        setSheetTopY={setSheetTopY}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        filteredPlaces={filteredPlaces}
        places={places}
        radiusM={radiusM}
        lastError={lastError}
        loading={loading}
        onSearchPress={triggerSearch}
        fromCache={fromCache}
        cacheTs={cacheTs}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        listRef={listRef}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        settings={settings}
        isFav={isFav}
        toggleFav={toggleFav}
        onNavigatePreferred={onNavigatePreferred}
        openNavigation={openNavigation}
        focusPlace={focusPlace}
        onFilterChangeStart={onFilterChangeStart}
        onFilterChangeEnd={onFilterChangeEnd}
      />

      <SettingsContainer
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        P={P}
        isDark={isDark}
        settings={settings}
        saveSettings={saveSettings}
        radiusM={radiusM}
        commitRadius={commitRadius}
        MIN_M={MIN_M}
        MAX_M={MAX_M}
        STEP_M={STEP_M}
        t={t}
      />

      <StatusBar style={isDark ? 'light' : 'dark'} />
      <DebugOverlay />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DebugProvider>
          <ErrorBoundary>
            <AppInner />
          </ErrorBoundary>
        </DebugProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = appStyles;
