import * as Haptics from 'expo-haptics';
import { ITEM_H, PIN_SELECTED_SCALE, TARGET_VISIBLE_SPAN_M } from '../utils/constants';

export function usePlaceFocus({
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
}) {
  const scrollToItem = (idx) => {
    if (listRef.current == null || typeof idx !== 'number') return;
    try {
      listRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0, viewOffset: sheetTopH + 8 });
    } catch {
      listRef.current.scrollToOffset({ offset: Math.max(ITEM_H * idx - sheetTopH, 0), animated: true });
    }
  };

  const focusPlace = (place) => {
    Haptics.selectionAsync();
    disableFollow?.();
    setSelectedId((prev) => (prev === place.id ? prev : place.id));
    if (!place?.location) return;

    if (selectedId === place.id && isExpanded) {
      const idx = idToIndex[place.id];
      setTimeout(() => scrollToItem(idx), 120);
      return;
    }

    if (isExpanded) {
      moveMarkerToVisibleCenter(place.location, {
        zoomFactor: 0.65,
        minDelta: 0.01,
        pinScale: PIN_SELECTED_SCALE,
        targetSpanM: TARGET_VISIBLE_SPAN_M,
      });
    } else {
      pendingFocusCoordRef.current = place.location;
      pendingFocusScaleRef.current = PIN_SELECTED_SCALE;
      setIsExpanded(true);
    }
  };

  const onMarkerPress = (place) => {
    if (selectedId === place.id && isExpanded) {
      return;
    }
    disableFollow?.();
    Haptics.selectionAsync();
    setSelectedId((prev) => (prev === place.id ? prev : place.id));

    if (isExpanded) {
      moveMarkerToVisibleCenter(place.location, {
        zoomFactor: 0.7,
        minDelta: 0.01,
        pinScale: PIN_SELECTED_SCALE,
        targetSpanM: TARGET_VISIBLE_SPAN_M,
      });
    } else {
      pendingFocusCoordRef.current = place.location || null;
      pendingFocusScaleRef.current = PIN_SELECTED_SCALE;
      setIsExpanded(true);
    }

    const idx = idToIndex[place.id];
    setTimeout(() => scrollToItem(idx), isExpanded ? 120 : 320);
  };

  return { focusPlace, onMarkerPress };
}


