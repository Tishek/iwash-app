import React from 'react';
import { View, Text, Image } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TopBars({ isDark, P, loading, t, styles, onTopLayout, onOpenSettings, onBrandLongPress }) {
  return (
    <>
      <BlurView
        intensity={25}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.topPill, styles.glass]}
        onLayout={onTopLayout}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={require('../../assets/icon.png')} style={styles.brandIcon} onLongPress={onBrandLongPress} />
          <Text style={[styles.topPillText, { color: P.text }]}>iWash</Text>
        </View>
      </BlurView>

      <BlurView
        intensity={25}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.statusPill, styles.glass]}
        onLayout={onTopLayout}
      >
        {loading ? (
          <>
            {/* ActivityIndicator is simple text here to avoid an extra import; parent keeps the real indicator */}
            <Text style={[styles.statusText, { color: P.text }]}>{t('updating')}</Text>
          </>
        ) : null}
        <Text
          onPress={onOpenSettings}
          style={[styles.gearIcon, { color: P.text }]}
          accessibilityLabel={t('settings')}
        >
          ⚙️
        </Text>
      </BlurView>
    </>
  );
}


