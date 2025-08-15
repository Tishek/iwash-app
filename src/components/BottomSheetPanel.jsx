import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// (zůstává) log při načtení modulu
console.log('BottomSheetPanel file loaded');

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
  onSheetIndexChange,
}) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['14%', '50%', '90%'], []);

  // DEBUG: mount/unmount + render počitadlo
  useEffect(() => {
    console.log('BottomSheetPanel mounted');
    return () => console.log('BottomSheetPanel unmounted');
  }, []);
  console.count('BottomSheetPanel render');

  const lastIndexRef = useRef(-1);
  useEffect(() => {
    if (!sheetRef.current) return;
    const target = isExpanded ? 1 : 0;
    if (lastIndexRef.current === target) return; // už jsme tam
    lastIndexRef.current = target;
    try { sheetRef.current.snapToIndex(target); } catch {}
  }, [isExpanded]);

  const handleSheetChange = useCallback(
    (index) => {
      const expanded = index > 0;
      // nastav jen když se opravdu liší → nevyvolávej smyčku
      if (expanded !== isExpanded) {
        setIsExpanded?.(expanded);
        try { Haptics.selectionAsync(); } catch {}
        onSheetIndexChange?.(index);
      }
    },
    [isExpanded, setIsExpanded, onSheetIndexChange]
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
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: selected ? 'rgba(56,116,255,0.12)' : 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <Text style={{ color: isDark ? '#fff' : '#111', fontWeight: '600' }}>
          {item?.name || t?.('unnamed') || 'Myčka'}
        </Text>
        {!!item?.vicinity && (
          <Text style={{ color: isDark ? '#cfcfcf' : '#555' }}>{item.vicinity}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Filtry (minimal)
  const FiltersBar = () => (
    <View
      onLayout={handleTopBarLayout}
      style={{ flexDirection: 'row', gap: 8, padding: 12 }}
    >
      {[
        ['ALL', t?.('all') || 'Vše'],
        ['CONTACT', t?.('contact') || 'Kontaktní'],
        ['NONCONTACT', t?.('noncontact') || 'Bezkontaktní'],
        ['FULLSERVICE', t?.('fullservice') || 'Full service'],
        ['FAV', t?.('favorites') || 'Oblíbené'],
      ].map(([key, label]) => (
        <TouchableOpacity
          key={key}
          onPress={() => { try { Haptics.selectionAsync(); } catch {} setFilterMode?.(key); }}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor:
              filterMode === key ? 'rgba(56,116,255,0.2)' : 'rgba(127,127,127,0.12)',
          }}
        >
          <Text style={{ color: isDark ? '#fff' : '#111' }}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

    return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        onChange={handleSheetChange}
        style={{ zIndex: 0 }}
        backgroundStyle={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: isDark ? '#16181c' : '#fff',
        }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#999' : '#ccc' }}
      >
        <FiltersBar />

        {lastError ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#e95' }}>{String(lastError)}</Text>
          </View>
        ) : (
          <BottomSheetFlatList
            ref={listRef}
            data={filteredPlaces || []}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
            ListEmptyComponent={
              <View style={{ padding: 16 }}>
                <Text style={{ color: isDark ? '#bbb' : '#666' }}>
                  {loading ? t?.('loading') || 'Načítám…' : t?.('noResults') || 'Nic nenalezeno'}
                </Text>
              </View>
            }
          />
        )}
      </BottomSheet>
    </View>
  );
}