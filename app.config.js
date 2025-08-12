export default ({ config }) => ({
  ...config,
  expo: {
    ...(config.expo || {}),

    name: 'iWash',          // ← text pod ikonou v iOS
    slug: 'iwashapp',       // může zůstat takhle

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
      infoPlist: {
        ...(config.expo?.ios?.infoPlist || {}),
        CFBundleDisplayName: 'iWash', // ← vynucení názvu pro iOS
        NSLocationWhenInUseUsageDescription:
          'Aplikace iWash používá vaši polohu k vyhledání nejbližších myček aut.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    extra: {
      ...(config.expo?.extra || {}),
      eas: {
        ...(config.expo?.extra?.eas || {}),
        projectId: '921ccb43-3892-4acd-9400-1d20af542edb',
      },
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
});
