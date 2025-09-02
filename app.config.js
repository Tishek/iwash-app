import 'dotenv/config';
export default ({ config }) => ({
  ...config,
  expo: {
    ...(config.expo || {}),

    name: 'iWash',
    slug: 'iwashapp',

    owner: 'tishek',
    runtimeVersion: '1.0.0',
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
        // Google Maps SDK for iOS (only needed if you switch provider to Google)
        googleMapsApiKey: process.env.IOS_MAPS_SDK_API_KEY,
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
      // Google Maps SDK for Android (tiles/SDK usage)
      config: {
        ...(config.expo?.android?.config || {}),
        googleMaps: {
          ...(config.expo?.android?.config?.googleMaps || {}),
          apiKey: process.env.ANDROID_MAPS_SDK_API_KEY,
        },
      },
    },

    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Aplikace iWash používá vaši polohu k vyhledání nejbližších myček aut.',
        },
      ],
    ],

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
