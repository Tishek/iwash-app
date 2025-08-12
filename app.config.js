// app.config.js
export default ({ config }) => ({
  ...config,
  expo: {
    ...(config.expo || {}),
    runtimeVersion: { policy: 'sdkVersion' }, // nutné pro OTA v Expo Go
    extra: {
      ...(config.expo?.extra || {}),
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
});