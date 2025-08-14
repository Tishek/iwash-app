import Constants from 'expo-constants';
export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  Constants.expoConfig?.extra?.googleMapsApiKey;