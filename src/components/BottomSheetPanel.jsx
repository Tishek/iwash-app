import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FiltersBar from './FiltersBar';

const s = StyleSheet.create({
  sheet: { zIndex: 0 },
  sheetBackground: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  filtersContainer: { flexDirection: 'row', gap: 8, padding: 12 },
  filterButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  filterButtonActive: { backgroundColor: 'rgba(56,116,255,0.2)' },
  filterButtonInactive: { backgroundColor: 'rgba(127,127,127,0.12)' },
  filterButtonTextDark: { color: '#fff' },
  filterButtonTextLight: { color: '#111' },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  listItemSelected: { backgroundColor: 'rgba(56,116,255,0.12)' },
  listItemTitle: { fontWeight: '600' },
  listItemTitleDark: { color: '#fff' },
  listItemTitleLight: { color: '#111' },
  listItemSubtitleDark: { color: '#cfcfcf' },
  listItemSubtitleLight: { color: '#555' },
  errorContainer: { padding: 16 },
  errorText: { color: '#e95' },
  emptyContainer: { padding: 16 },
  emptyTextDark: { color: '#bbb' },
  emptyTextLight: { color: '#666' },
});

// (zůstává) log při načtení modulu
console.log('BottomSheetPanel file loaded');

export default function BottomSheetPanel({
  styles,
  P,
  isDark,
  t,
  snapPoints,
  sheetIndex,
  setSheetTopH,
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
  onSheetIndexChange,
}) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);

  // DEBUG: mount/unmount + render počitadlo
  useEffect(() => {
    console.log('BottomSheetPanel mounted');
    return () => console.log('BottomSheetPanel unmounted');
  }, []);
  console.count('BottomSheetPanel render');

  const handleSheetChange = useCallback(
    (index) => {
      try { Haptics.selectionAsync(); } catch {}
      onSheetIndexChange?.(index);
    },
    [onSheetIndexChange]
  );

  const topBarHRef = useRef(-1);
  const handleTopBarLayout = useCallback(
    (e) => {
      const h = e?.nativeEvent?.layout?.height ?? 0;
      // zapiš jen při reálné změně (eliminuje nekonečnou smyčku)
      if (Math.abs(h - topBarHRef.current) > 0.5) {
        topBarHRef.current = h;
        setSheetTopH?.(h);
      }
    },
    [setSheetTopH]
  );

  const keyExtractor = (item) =>
    item?.place_id || item?.id || String(item?.reference || Math.random());

  const renderItem = ({ item }) => {
    const id = item?.place_id || item?.id;
    const selected = selectedId === id;
    return (
      <TouchableOpacity
        onPress={() => focusPlace?.(item)}
        style={[s.listItem, selected && s.listItemSelected]}
      >
        <Text
          style={[s.listItemTitle, isDark ? s.listItemTitleDark : s.listItemTitleLight]}
        >
          {item?.name || t?.('unnamed') || 'Myčka'}
        </Text>
        {!!item?.vicinity && (
          <Text
            style={isDark ? s.listItemSubtitleDark : s.listItemSubtitleLight}
          >
            {item.vicinity}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <BottomSheet
        ref={sheetRef}
        index={sheetIndex}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        enableOverDrag={false}
        onChange={handleSheetChange}
        style={s.sheet}
        backgroundStyle={[
          s.sheetBackground,
          { backgroundColor: isDark ? '#16181c' : '#fff' },
        ]}
        handleIndicatorStyle={[
          s.handleIndicator,
          { backgroundColor: isDark ? '#999' : '#ccc' },
        ]}
      >
        <FiltersBar
          t={t}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          isDark={isDark}
          onLayout={handleTopBarLayout}
          styles={s}
        />

        {lastError ? (
          <View style={s.errorContainer}>
            <Text style={s.errorText}>{String(lastError)}</Text>
          </View>
        ) : (
          <BottomSheetFlatList
            ref={listRef}
            data={filteredPlaces || []}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
            ListEmptyComponent={
              <View style={s.emptyContainer}>
                <Text
                  style={isDark ? s.emptyTextDark : s.emptyTextLight}
                >
                  {loading
                    ? t?.('loading') || 'Načítám…'
                    : t?.('noResults') || 'Nic nenalezeno'}
                </Text>
              </View>
            }
          />
        )}
      </BottomSheet>
    </View>
  );
}
