// src/components/ListContent.jsx
import React, { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList } from 'react-native';
import ListHeader from '../components/ListHeader';
import { DEV_ERROR } from '../utils/devlog';
import FiltersRow from '../components/FiltersRow';
import PlaceCard from '../components/PlaceCard.jsx';
import { ITEM_H } from '../utils/constants';

export default function ListContent({
  styles,
  P,
  isDark,
  t,
  isFullyExpanded,
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
  setSheetTopH,
  scrollHandlerRef,
}) {
  const insets = useSafeAreaInsets?.() || { bottom: 0 };
  // Full: ještě menší padding; Half/Collapsed: rezerva kvůli tlačítkům Navigovat
  const bottomPad = isFullyExpanded
    ? Math.max(56, (insets?.bottom || 0) + 12)
    : (insets?.bottom || 0) + ITEM_H * 3;
  // --- ČISTÉ JS FUNKCE (bez workletu) ---------------------------------------
  // Pokud je budeš volat z workletu, použij: runOnJS(scrollToIndexJS)(i)
  const scrollToIndexJS = useCallback(
    (index) => {
      const i = Math.max(0, Math.min(index ?? 0, Math.max(filteredPlaces.length - 1, 0)));
      const offset = i * ITEM_H;
      listRef?.current?.scrollToOffset?.({ offset, animated: true });
    },
    [filteredPlaces.length, listRef]
  );

  const scrollToOffsetJS = useCallback(
    (offsetPx) => {
      const offset = Math.max(0, offsetPx ?? 0);
      listRef?.current?.scrollToOffset?.({ offset, animated: true });
    },
    [listRef]
  );
  // --------------------------------------------------------------------------

  const onHeaderLayout = useCallback(
    (e) => setSheetTopH?.(e.nativeEvent.layout.height),
    [setSheetTopH]
  );

  const onScrollToIndexFailed = useCallback(
    (info) => {
      // Fallback – někdy FlatList index ještě nemá změřené layouty
      const safeIndex = Math.max(
        0,
        Math.min(info?.index ?? 0, Math.max(filteredPlaces.length - 1, 0))
      );
      scrollToOffsetJS(safeIndex * ITEM_H);
    },
    [filteredPlaces.length, scrollToOffsetJS]
  );

  return (
    <>
      <View onLayout={onHeaderLayout}>
        <ListHeader
          P={P}
          t={t}
          isDark={isDark}
          radiusM={radiusM}
          filteredCount={filteredPlaces.length}
          totalCount={places.length}
          lastError={lastError}
          loading={loading}
          onSearchPress={onSearchPress}
          fromCache={fromCache}
          cacheTs={cacheTs}
          styles={styles}
        />

        <FiltersRow
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          isDark={isDark}
          P={P}
          styles={styles}
          t={t}
        />
      </View>

      <View style={styles.sheetBody}>
        {filteredPlaces.length === 0 ? (
          <Text style={[styles.placeholder, { color: P.textMute }]}>
            {t('empty')}
          </Text>
        ) : (
          <>
              <FlatList
                ref={listRef}
                style={{ flex: 1 }}
                data={filteredPlaces}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentContainerStyle={{ paddingBottom: bottomPad }}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                scrollEventThrottle={16}
                nestedScrollEnabled
                removeClippedSubviews
                getItemLayout={(data, index) => ({ length: ITEM_H + 8, offset: (ITEM_H + 8) * index, index })}
                initialNumToRender={8}
                windowSize={7}
                maxToRenderPerBatch={8}
                onScrollToIndexFailed={onScrollToIndexFailed}
              renderItem={({ item, index }) => {
                try {
                  return (
                    <PlaceCard
                      item={item}
                      index={index}
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
                  );
                } catch (e) {
                  // Defensive: pokud by selhala renderItem, zaloguj a přeskoč položku
                  DEV_ERROR('[ListContent] renderItem failed:', e);
                  return null;
                }
              }}
            />
          </>
        )}
      </View>
    </>
  );
}
