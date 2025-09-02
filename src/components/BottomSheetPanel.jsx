// src/components/BottomSheetPanel.jsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import ListContent from '../screens/ListContent.jsx';

export default function BottomSheetPanel({
  styles,
  P,
  isDark,
  t,
  sheetH,
  setSheetTopH,
  isExpanded,
  setIsExpanded, // v Containeru spouští animovaný snap
  isFullyExpanded,
  scrollHandlerRef,
  filteredPlaces,
  places,
  radiusM,
  lastError,
  loading,
  onSearchPress,
  fromCache,
  cacheTs,
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
    <Animated.View
      // NEpoužíváme styles.sheet – mohl přepisovat position/bottom apod.
      style={[
        localStyles.rootSheet,
        {
          height: sheetH,
          backgroundColor: P.bg,
          borderTopColor: P.border,
          borderTopWidth: isDark ? 1 : 0,
        },
      ]}
    >
      
      {/* Handle (úchytka) – tap stále toggluje, swipe řeší kontejner */}
      <Pressable onPress={() => setIsExpanded(!isExpanded)}
        hitSlop={12}
        style={styles.sheetHandleArea}
        accessibilityRole="button"
        accessibilityLabel={t?.('common.pullUp') ?? 'Pull up'}
      >
        <View
          style={[
            styles.handle,
            { backgroundColor: isDark ? '#26324A' : '#E2E6EE' },
          ]}
        />
      </Pressable>

      {/* Vnitřní wrapper pro obsah – sem klidně přesuň paddingy z původního styles.sheet */}
      <View style={localStyles.contentWrap}>
        <ListContent
          styles={styles}
          P={P}
          isDark={isDark}
          t={t}
          isFullyExpanded={isFullyExpanded}
          filteredPlaces={filteredPlaces}
          places={places}
          radiusM={radiusM}
        lastError={lastError}
        loading={loading}
        onSearchPress={onSearchPress}
        fromCache={fromCache}
        cacheTs={cacheTs}
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
          setSheetTopH={setSheetTopH}
          scrollHandlerRef={scrollHandlerRef}
        />
      </View>
    </Animated.View>
  );
}

const localStyles = StyleSheet.create({
  rootSheet: {
    // Pozor: pozicování řeší CONTAINER (absolute + bottom animace).
    // Tady nechceme nic, co by to přepsalo.
    // Jen vizuální vlastnosti kořene listu:
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  contentWrap: {
    // Vyplň zbývající prostor pod hlavičkou, aby FlatList dostal výšku
    flex: 1,
    paddingBottom: 8,
  },
  debugBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 28,
    backgroundColor: 'rgba(0,255,128,0.4)',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugText: { color: '#003', fontWeight: 'bold' },
});

function ListPlaceholder({ P, t, styles }) {
  return (
    <View>
      <Animated.Text style={[styles.placeholder, { color: P.textMute }]}>
        {t('empty')}
      </Animated.Text>
    </View>
  );
}

// Pozn.: PlacesList beze změn – render řeší ListContent.
