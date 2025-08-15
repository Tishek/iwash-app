import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, Animated, Dimensions, Alert, Linking, LogBox } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { openNavigationTo } from './src/utils/navigation';
import {
  ITEM_H, MIN_M, MAX_M, STEP_M,
  PIN_SELECTED_SCALE, PIN_ANCHOR_OFFSET_BASE,
  TARGET_VISIBLE_SPAN_M,
} from './src/utils/constants';
import { useSettings } from './src/hooks/useSettings';
import { useFavorites } from './src/hooks/useFavorites';
import SettingsContainer from './src/components/SettingsContainer';
import MainMapView from './src/components/MainMapView';
import SearchControls from './src/components/SearchControls';
import { createTranslator } from './src/i18n/strings';
// import { fetchNearbyCarWashes } from './src/services/places';
import TopBars from './src/components/TopBars';
import BottomSheetContainer from './src/components/BottomSheetContainer';
import MarkersLayer from './src/components/MarkersLayer';
import { appStyles } from './src/styles/appStyles';
import { useClustering } from './src/hooks/useClustering';
import { usePinSelection } from './src/hooks/usePinSelection';
import { useLocationFollow } from './src/hooks/useLocationFollow';
import { makeClusterPressHandler } from './src/utils/clusterHandlers';
import { useVisibleCentering } from './src/hooks/useVisibleCentering';
import { useThemePalette } from './src/hooks/useThemePalette';
import { useRadius } from './src/hooks/useRadius';
import { useFilteredPlaces } from './src/hooks/useFilteredPlaces';
import { useAuraPulse } from './src/hooks/useAuraPulse';
import { useClusterRadiusPx } from './src/hooks/useClusterRadiusPx';
import ClusterRenderer from './src/components/ClusterRenderer';
import { DEV_LOG, DEV_WARN, DEV_INFO, DEV_ERROR } from './src/utils/devlog';
import { usePlacesSearch } from './src/hooks/usePlacesSearch';
import { usePlaceFocus } from './src/hooks/usePlaceFocus';
import { useTopOcclusion } from './src/hooks/useTopOcclusion';
import { useSearchControls } from './src/hooks/useSearchControls';
import { DebugProvider } from './src/debug/DebugProvider';
import DebugOverlay from './src/debug/DebugOverlay';
import { useDebug } from './src/debug/useDebug';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// i18n via helper

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
// Silence transient supercluster race when a cluster id disappears during re-cluster
LogBox.ignoreLogs(['No cluster with the specified id']);

// Dev-only logger helpers moved to utils/devlog

function AppInner() {
  const mapRef = useRef(null);
  const listRef = useRef(null);
  const pendingFocusCoordRef = useRef(null);
  const pendingFocusScaleRef = useRef(0); // 0 = žádný offset (střed/moje poloha), 1.35 = vybraný pin
  // Guard to avoid setState loops while we animate the map
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
  // Safe-area insets (notch)
  const insets = useSafeAreaInsets();
  // Lock to avoid multiple overlapping cluster zoom sequences
  const clusterZoomingRef = useRef(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [sheetTopH, setSheetTopH] = useState(0);
  const [sheetTop, setSheetTop] = useState(SCREEN_H);
  const isExpanded = sheetIndex > 0;

  const { hasPermission, region, setRegion, coords, followMe, setFollowMe, disableFollow, recenter } = useLocationFollow({
    animateToRegionSafe,
    initialRegionFallback: { latitude: 50.087465, longitude: 14.421254, latitudeDelta: 0.05, longitudeDelta: 0.05 },
  });

  // Nejvyšší Y overlay přes mapu
  const { topUiBottomY, registerTopOcclusion } = useTopOcclusion();

  // držíme poslední region pro porovnání a odfiltrování mikroskopických změn
  const regionRef = useRef(null);
  useEffect(() => { regionRef.current = region; }, [region]);

  // radius (m)
  const { radiusM, setRadiusM, commitRadius, adjustRadius } = useRadius(settings, saveSettings);

  // data myček přes hook
  const { places, setPlaces, loading, lastError, setLastError, autoReloadTimerRef, searchHere } = usePlacesSearch({
    t,
    API_KEY,
    settings,
    coords,
    radiusM,
    searchCenter: null,
    autoReload: settings?.autoReload,
  });
  // filtered places + selection
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | CONTACT | NONCONTACT | FULLSERVICE | FAV
  const { favorites, favoritesData, isFav, toggleFav } = useFavorites();
  // compute search center early so filtering can use it
  const searchCenter = useMemo(() => {
    if (settings.searchFrom === 'myLocation' && coords) return { latitude: coords.latitude, longitude: coords.longitude };
    if (region) return { latitude: region.latitude, longitude: region.longitude };
    return null;
  }, [settings.searchFrom, coords, region]);
  const { filteredPlaces, selectedId, setSelectedId, idToIndex } = useFilteredPlaces({
    places,
    filterMode,
    isFav,
    favoritesData,
    searchCenter,
  });
  // autoReload timer je spravován hookem
  
  // --- Výběr pinů (animace) ---
  const { getPinScale } = usePinSelection(selectedId);

  // aura
  const { ringScale, ringOpacity } = useAuraPulse();

  const { isDark, P } = useThemePalette(settings.theme);

  // poloha přesunuta do useLocationFollow

  // cluster radius v pixelech – čím víc přiblíženo, tím menší radius
  const clusterRadiusPx = useClusterRadiusPx(region);

  // handle pending focus once sheet opens
  useEffect(() => {
    if (sheetIndex > 0 && pendingFocusCoordRef.current) {
      const coord = pendingFocusCoordRef.current;
      const scale = pendingFocusScaleRef.current ?? 0;
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
  }, [sheetIndex, moveMarkerToVisibleCenter]);

  // Visible centering utilities (extract from hook)
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

  // sheetTop is updated from BottomSheetPanel

  // Střed vyhledávání podle nastavení (výše kvůli filtru)

  // proxy spouštěč vyhledávání přes hook
  const triggerSearch = () =>
    searchHere(searchCenter, (focusCoord) => {
      pendingFocusCoordRef.current = focusCoord;
      pendingFocusScaleRef.current = 0;
      setSheetIndex(1);
    });

  // auto reload řeší hook usePlacesSearch

  // filtering handled via hook

  const openNavigation = async (item, app) => openNavigationTo(item, app, t, Linking, Alert);

  const onNavigatePreferred = (item) => {
    const app = settings.preferredNav || 'google';
    openNavigation(item, app);
  };

  const { focusPlace, onMarkerPress } = usePlaceFocus({
    selectedId,
    setSelectedId,
    sheetIndex,
    setSheetIndex,
    idToIndex,
    listRef,
    sheetTopH,
    moveMarkerToVisibleCenter,
    disableFollow,
    pendingFocusCoordRef,
    pendingFocusScaleRef,
  });

  // removed local wait utilities (handled inside hooks)

  // Compute edge padding for cluster fit. When the sheet is expanded,
  // we intentionally behave like the sheet was collapsed so the map
  // fits clusters the same way in both states (prevents over-zooming out).
  const { getClusterEdgePadding, progressiveClusterZoom, collectCoordsFromBBox } = useClustering({
    insets,
    topUiBottomY,
    isExpanded,
    sheetTop,
    screen: { width: SCREEN_W, height: SCREEN_H },
    regionRef,
    region,
    clusterRadiusPx,
    filteredPlaces,
    moveMarkerToVisibleCenter,
    centerLockRef,
  });


  // wrap to include haptics + guard
  const progressiveClusterZoomWrapped = async (center) => {
    if (!center || !mapRef.current) return;
    if (clusterZoomingRef.current) return;
    clusterZoomingRef.current = true;
    disableFollow();
    try { Haptics.selectionAsync(); } catch {}
    try { await progressiveClusterZoom(center); } finally { clusterZoomingRef.current = false; }
  };

  // Fallback: approximate cluster content by a pixel-radius bounding box around the cluster center
  const collectCoordsFromBBoxWrapped = (center) => collectCoordsFromBBox(center);

  // sjednocené ovladače pro TopBars/RadiusDock/QuickRadiusChips
  const controls = useSearchControls({
    t,
    settings,
    recenter,
    adjustRadius,
    commitRadius,
    setSettingsOpen,
    onSearch: triggerSearch,
  });

  const { toggleOverlay } = (function useMaybeDebug() { try { return useDebug() || {}; } catch { return {}; } })();

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
        filteredPlaces={filteredPlaces}
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
        log={(...args) => DEV_LOG('🟣 [renderCluster]', ...args)}
      />

      <BottomSheetContainer
        styles={styles}
        P={P}
        isDark={isDark}
        t={t}
        setSheetTopH={setSheetTopH}
        setSheetTop={setSheetTop}
        sheetIndex={sheetIndex}
        filteredPlaces={filteredPlaces}
        places={places}
        radiusM={radiusM}
        lastError={lastError}
        loading={loading}
        onSearchPress={triggerSearch}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        listRef={listRef}
        selectedId={selectedId}
        settings={settings}
        isFav={isFav}
        toggleFav={toggleFav}
        onNavigatePreferred={onNavigatePreferred}
        openNavigation={openNavigation}
        focusPlace={focusPlace}
        onSheetIndexChange={setSheetIndex}
      />

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
        sheetIndex={sheetIndex}
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
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <DebugProvider>
          <AppInner />
        </DebugProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = appStyles;