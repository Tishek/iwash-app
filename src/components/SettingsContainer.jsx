import React from 'react';
import * as Haptics from 'expo-haptics';
import SettingsScreen from '../../src/SettingsScreen';

export default function SettingsContainer({
  visible,
  onClose,
  P,
  isDark,
  settings,
  saveSettings,
  radiusM,
  commitRadius,
  MIN_M,
  MAX_M,
  STEP_M,
  t,
}) {
  const closeWithHaptic = () => { try { Haptics.selectionAsync(); } catch {} onClose?.(); };
  return (
    <SettingsScreen
      visible={visible}
      onClose={closeWithHaptic}
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
  );
}


