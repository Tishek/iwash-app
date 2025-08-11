import React from 'react';
import { View, Text, FlatList } from 'react-native';
import ListHeader from '../components/ListHeader';
import FiltersRow from '../components/FiltersRow';
import PlaceCard from '../components/PlaceCard.jsx';
import { ITEM_H } from '../utils/constants';

export default function ListContent({
  styles,
  P,
  isDark,
  t,
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
  setSheetTopH,
}) {
  return (
    <>
      <View onLayout={(e) => setSheetTopH?.(e.nativeEvent.layout.height)}>
        <ListHeader
          P={P}
          t={t}
          radiusM={radiusM}
          filteredCount={filteredPlaces.length}
          totalCount={places.length}
          lastError={lastError}
          loading={loading}
          onSearchPress={onSearchPress}
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
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            data={filteredPlaces}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            scrollEventThrottle={16}
            nestedScrollEnabled
            getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({ offset: Math.max(ITEM_H * Math.min(info.index, filteredPlaces.length - 1), 0), animated: true });
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
        )}
      </View>
    </>
  );
}


