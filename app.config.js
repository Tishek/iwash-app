export default ({ config }) => ({
  ...config,
  expo: {
    ...(config.expo || {}),

    name: 'iWash',
    slug: 'iwashapp',

    owner: 'tishek',
    runtimeVersion: { policy: 'sdkVersion' },
    updates: {
      ...(config.expo?.updates || {}),
      url: 'https://u.expo.dev/921ccb43-3892-4acd-9400-1d20af542edb',
      enabled: true,
      checkAutomatically: 'ON_LOAD',
    },

    icon: './assets/icon.png',

    ios: {
      ...(config.expo?.ios || {}),
      bundleIdentifier: 'com.tishek.iwash',
      config: {
        ...(config.expo?.ios?.config || {}),
        // Načítání iOS Google Maps klíče z prostředí (.env nebo EAS Secrets)
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        ...(config.expo?.ios?.infoPlist || {}),
        CFBundleDisplayName: 'iWash',
        NSLocationWhenInUseUsageDescription:
          'Aplikace iWash používá vaši polohu k vyhledání nejbližších myček aut.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      ...(config.expo?.android || {}),
      package: 'com.tishek.iwash',
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      config: {
        ...(config.expo?.android?.config || {}),
        googleMaps: {
          // Android klíč načtený z prostředí
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
        },
      },
    },
    extra: {
      ...(config.expo?.extra || {}),
      eas: {
        ...(config.expo?.extra?.eas || {}),
        projectId: '921ccb43-3892-4acd-9400-1d20af542edb',
      },
    },
  },
});