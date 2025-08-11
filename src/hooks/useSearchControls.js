import * as Haptics from 'expo-haptics';

export function useSearchControls({
  t,
  settings,
  recenter,
  adjustRadius,
  commitRadius,
  setSettingsOpen,
  onSearch,
}) {
  const openSettings = () => { try { Haptics.selectionAsync(); } catch {} setSettingsOpen(true); };
  const onRecenter = () => { try { Haptics.selectionAsync(); } catch {} recenter?.(); };
  const onAdjustRadius = (d) => { try { Haptics.selectionAsync(); } catch {} adjustRadius?.(d); };
  const onCommitRadius = (m) => { try { Haptics.selectionAsync(); } catch {} commitRadius?.(m); };
  const onSearchPress = () => { onSearch?.(); };

  return {
    openSettings,
    onRecenter,
    onAdjustRadius,
    onCommitRadius,
    onSearchPress,
    searchFrom: settings?.searchFrom,
    t,
  };
}


