// src/utils/config.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Prefer platform-specific public keys when available, then generic, then app config extra
export const GOOGLE_MAPS_API_KEY =
  (Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
    : Platform.OS === 'android'
      ? (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
      : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) ||
  Constants.expoConfig?.extra?.googleMapsApiKey ||
  null;
