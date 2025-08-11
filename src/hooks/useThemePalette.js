import { useColorScheme } from 'react-native';

export function useThemePalette(settingsTheme) {
  const systemScheme = useColorScheme();
  const resolvedTheme = settingsTheme === 'system' ? (systemScheme || 'light') : settingsTheme;
  const isDark = resolvedTheme === 'dark';
  const P = {
    bg: isDark ? '#0B0F17' : '#fff',
    surface: isDark ? '#121826' : '#F7F8FB',
    text: isDark ? '#E6E9F2' : '#111',
    textMute: isDark ? 'rgba(230,233,242,0.7)' : 'rgba(17,17,17,0.7)',
    pillBg: isDark ? 'rgba(18,24,38,0.95)' : 'rgba(255,255,255,0.95)',
    border: isDark ? '#1E2638' : '#E6EAF2',
  };
  return { resolvedTheme, isDark, P };
}


