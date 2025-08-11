# iWash - Car Wash Finder App

A sophisticated React Native app built with Expo that helps users find nearby car washes with advanced filtering, clustering, and navigation features.

## ✨ Features

### 🗺️ **Interactive Map & Search**
- **Interactive map** with real-time location tracking
- **Radius-based search** (500m - 5000m, adjustable in 100m increments)
- **Search center options**: My location or Map center
- **Auto-reload** results when moving the map
- **Manual search** with custom radius

### 🔍 **Smart Search & Filtering**
- **Google Places API** integration for comprehensive car wash data
- **Advanced filtering**: Contact, Touchless, Full Service, Favorites
- **Intelligent type inference** with manual overrides
- **Distance-based sorting** (closest first)
- **Pagination support** with `next_page_token` for more results

### 📍 **Map Features**
- **Marker clustering** for better map readability
- **Smooth animations** and pin selection effects
- **Location following** with manual override
- **Crosshair indicator** when searching from map center
- **Aura pulse effect** for visual feedback

### 📱 **User Interface**
- **Bottom sheet** with expandable list view
- **Quick radius chips** for common distances
- **Radius dock** with slider control
- **Dark/Light theme** support (system, manual, or forced)
- **Bilingual support**: Czech (CS) and English (EN)
- **Haptic feedback** for interactions

### ⭐ **Favorites & Personalization**
- **Favorite car washes** (up to 3, stored locally)
- **Customizable settings** with persistent storage
- **Preferred navigation app** (Apple Maps, Google Maps, Waze, or Ask)
- **Default radius** configuration
- **Theme preferences**

### 🧭 **Navigation Integration**
- **One-tap navigation** to car washes
- **Multiple app support**: Apple Maps, Google Maps, Waze
- **Smart app selection** based on preferences
- **Fallback handling** for navigation failures

### 🎨 **Advanced UI Components**
- **Responsive bottom sheet** with smooth animations
- **Search controls** with loading states
- **Filter row** with visual indicators
- **Place cards** with detailed information
- **Marker pins** with selection states
- **Cluster renderer** for grouped locations

## 🏗️ Architecture

### **Core Structure**
```
iwash-app/
├── App.js                 # Main application component
├── index.js              # Entry point
├── package.json          # Dependencies and scripts
├── eas.json             # Expo Application Services config
├── assets/               # App icons and splash screens
└── src/                  # Source code
```

### **Component Architecture**
```
src/
├── components/           # Reusable UI components
│   ├── MainMapView.jsx          # Main map container
│   ├── MapViewClustered.jsx     # Clustered map implementation
│   ├── MarkersLayer.jsx         # Map markers management
│   ├── MarkerPin.jsx            # Individual marker component
│   ├── ClusterRenderer.jsx      # Cluster visualization
│   ├── BottomSheetContainer.jsx # Bottom sheet wrapper
│   ├── BottomSheetPanel.jsx     # Bottom sheet content
│   ├── SearchControls.jsx       # Search interface
│   ├── TopBars.jsx              # Top navigation bars
│   ├── RadiusDock.jsx           # Radius control dock
│   ├── QuickRadiusChips.jsx     # Quick radius selection
│   ├── FiltersRow.jsx           # Filter controls
│   ├── PlaceCard.jsx            # Car wash information card
│   ├── ListHeader.jsx           # List section headers
│   ├── MeMarker.jsx             # Current location marker
│   └── SettingsContainer.jsx    # Settings modal
├── hooks/                # Custom React hooks
│   ├── useLocationFollow.js     # Location tracking
│   ├── usePlacesSearch.js       # Places API integration
│   ├── useClustering.js         # Marker clustering logic
│   ├── useFilteredPlaces.js     # Data filtering
│   ├── useFavorites.js          # Favorites management
│   ├── useSettings.js           # Settings persistence
│   ├── useBottomSheet.js        # Bottom sheet state
│   ├── useRadius.js             # Radius management
│   ├── usePinSelection.js       # Pin selection state
│   ├── usePlaceFocus.js         # Place focus management
│   ├── useVisibleCentering.js   # Map centering logic
│   ├── useThemePalette.js       # Theme management
│   ├── useSearchControls.js     # Search control state
│   ├── useTopOcclusion.js      # UI overlap detection
│   ├── useClusterRadiusPx.js    # Cluster radius calculation
│   └── useAuraPulse.js          # Visual effects
├── services/             # External API services
│   └── places.js                # Google Places API integration
├── utils/                # Utility functions
│   ├── constants.js             # App constants and defaults
│   ├── geo.js                  # Geographic calculations
│   ├── inferType.js             # Car wash type inference
│   ├── text.js                  # Text normalization
│   ├── clusterHandlers.js       # Cluster interaction handlers
│   ├── navigation.js            # Navigation utilities
│   └── devlog.js                # Development logging
├── i18n/                 # Internationalization
│   └── strings.js               # Multi-language strings
├── styles/               # Styling
│   └── appStyles.js             # App-wide styles
└── debug/                # Debug utilities
    ├── DebugProvider.jsx        # Debug context provider
    ├── DebugOverlay.jsx         # Debug information overlay
    └── useDebug.js              # Debug hook
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v18 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (optional)
- Physical device with Expo Go app

### **Installation**
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iwash-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
   ```

4. **Get Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable **Places API** and **Maps JavaScript API**
   - Create credentials (API Key)
   - Restrict the key to your app's bundle identifier

### **Running the App**
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on web (limited functionality)
npx expo start --web
```

## ⚙️ Configuration

### **App Settings**
- **Auto-reload**: Automatically refresh results when moving the map
- **Default radius**: Initial search radius (500m - 5000m)
- **Search center**: Choose between "My Location" or "Map Center"
- **Theme**: System, Light, or Dark mode
- **Preferred navigation**: Apple Maps, Google Maps, Waze, or Ask

### **Search Parameters**
- **Radius range**: 500m to 5000m
- **Step size**: 100m increments
- **Max results**: 60 locations per search
- **Type inference**: Automatic categorization with manual overrides

## 🔧 Development

### **Key Technologies**
- **React Native 0.79.5** with Expo SDK 53
- **React 19.0.0** with modern hooks
- **react-native-maps** for map functionality
- **react-native-map-clustering** for marker grouping
- **AsyncStorage** for local data persistence
- **Expo Location** for GPS services
- **Expo Haptics** for tactile feedback

### **State Management**
- **Custom hooks** for specific functionality
- **Local state** with React hooks
- **AsyncStorage** for persistent data
- **Context API** for debug functionality

### **Performance Features**
- **Marker clustering** for large datasets
- **Lazy loading** with pagination
- **Optimized re-renders** with useMemo and useCallback
- **Smooth animations** with Animated API

## 📱 Platform Support

### **iOS**
- ✅ Full functionality
- ✅ Native maps integration
- ✅ Haptic feedback
- ✅ Safe area handling

### **Android**
- ✅ Full functionality
- ✅ Google Maps integration
- ✅ Haptic feedback
- ✅ Safe area handling

### **Web**
- ⚠️ Limited functionality
- ⚠️ No GPS access
- ⚠️ No haptic feedback

## 🚧 Roadmap

### **Planned Features**
- [ ] **Offline caching** of recent search results
- [ ] **Advanced filters**: 24/7 operation, self-service options
- [ ] **Reviews integration** with detailed ratings
- [ ] **Route optimization** for multiple destinations
- [ ] **Push notifications** for favorite car washes
- [ ] **Social features** and user reviews
- [ ] **Analytics dashboard** for usage statistics

### **Technical Improvements**
- [ ] **Performance optimization** for large datasets
- [ ] **Accessibility improvements** (VoiceOver, TalkBack)
- [ ] **Unit and integration tests**
- [ ] **CI/CD pipeline** setup
- [ ] **Performance monitoring** integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Places API** for comprehensive location data
- **Expo team** for the excellent development platform
- **React Native community** for the robust ecosystem
- **Open source contributors** for various libraries and tools

---

**Built with ❤️ using React Native and Expo**





