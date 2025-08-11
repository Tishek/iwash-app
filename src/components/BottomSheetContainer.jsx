import React from 'react';
import * as Haptics from 'expo-haptics';
import BottomSheetPanel from './BottomSheetPanel';

export default function BottomSheetContainer({
  styles,
  P,
  isDark,
  t,
  sheetH,
  setSheetTopH,
  isExpanded,
  setIsExpanded,
  filteredPlaces,
  places,
  radiusM,
  lastError,
  loading,
  onSearchPress,
  filterMode,
  setFilterMode,
  listRef,
  selectedId,
  settings,
  isFav,
  toggleFav,
  onNavigatePreferred,
  openNavigation,
  focusPlace,
}) {
  return (
    <BottomSheetPanel
      styles={styles}
      P={P}
      isDark={isDark}
      t={t}
      sheetH={sheetH}
      setSheetTopH={setSheetTopH}
      isExpanded={isExpanded}
      setIsExpanded={() => { try { Haptics.selectionAsync(); } catch {} setIsExpanded(prev => !prev); }}
      filteredPlaces={filteredPlaces}
      places={places}
      radiusM={radiusM}
      lastError={lastError}
      loading={loading}
      onSearchPress={onSearchPress}
      filterMode={filterMode}
      setFilterMode={(key)=>{ try { Haptics.selectionAsync(); } catch {} setFilterMode(key); }}
      listRef={listRef}
      selectedId={selectedId}
      settings={settings}
      isFav={isFav}
      toggleFav={toggleFav}
      onNavigatePreferred={onNavigatePreferred}
      openNavigation={openNavigation}
      focusPlace={focusPlace}
    />
  );
}


