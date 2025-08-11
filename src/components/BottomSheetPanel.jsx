import React from 'react';
import { View, Animated } from 'react-native';
import ListContent from '../screens/ListContent.jsx';

export default function BottomSheetPanel({
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
    <Animated.View style={[styles.sheet, { height: sheetH, backgroundColor: P.bg, borderTopColor: P.border, borderTopWidth: isDark ? 1 : 0 }]}>
      <View
        onTouchEnd={() => setIsExpanded(v => !v)}
        style={styles.sheetHandleArea}
      >
        <View style={[styles.handle, { backgroundColor: isDark ? '#26324A' : '#E2E6EE' }]} />
      </View>

      <ListContent
        styles={styles}
        P={P}
        isDark={isDark}
        t={t}
        filteredPlaces={filteredPlaces}
        places={places}
        radiusM={radiusM}
        lastError={lastError}
        loading={loading}
        onSearchPress={onSearchPress}
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
      />
    </Animated.View>
  );
}

function ListPlaceholder({ P, t, styles }) {
  return (
    <View>
      <Animated.Text style={[styles.placeholder, { color: P.textMute }]}>
        {t('empty')}
      </Animated.Text>
    </View>
  );
}

function PlacesList({ styles, data, listRef, selectedId, isDark, P, settings, isFav, toggleFav, onNavigatePreferred, openNavigation, focusPlace, t }) {
  const { FlatList, View } = require('react-native');
  return (
    <FlatList
      ref={listRef}
      style={{ flex: 1 }}
      data={data}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      scrollEventThrottle={16}
      nestedScrollEnabled
      getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
      onScrollToIndexFailed={(info) => {
        listRef.current?.scrollToOffset({ offset: Math.max(ITEM_H * Math.min(info.index, data.length - 1), 0), animated: true });
      }}
      renderItem={({ item }) => (
        <PlaceCard
          item={item}
          selected={selectedId === item.id}
          isDark={isDark}
          P={P}
          settings={settings}
          isFav={isFav}
          toggleFav={toggleFav}
          onNavigatePreferred={onNavigatePreferred}
          openNavigation={openNavigation}
          focusPlace={focusPlace}
          t={t}
        />
      )}
    />
  );
}


