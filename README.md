# iWash – vyhledávač myček aut 🚗🧼

Pokročilá aplikace v **React Native (Expo)**, která pomáhá najít myčky aut v okolí. Nabízí chytré filtrování, klastrování pinů, dvojjazyčné rozhraní (CS/EN) a rychlé spuštění navigace do vybraného místa.

---

## ✨ Funkce

### 🗺️ Interaktivní mapa & vyhledávání
- Sledování polohy v reálném čase  
- Vyhledávání podle **radiusu** (500 m – 5000 m, krok 100 m)  
- **Střed vyhledávání**: Moje poloha nebo Střed mapy  
- **Auto-reload** výsledků při posunu mapy  
- **Ruční vyhledávání** s vlastním radiusem  

### 🔍 Chytré vyhledávání & filtrování
- Integrace **Google Places API**  
- **Filtry**: Kontaktní, Bezkontaktní, Automat, Oblíbené  
- **Inteligentní odvozování typu** s možností manuální úpravy  
- **Řazení podle vzdálenosti** (nejbližší první)  
- **Paginace** přes `next_page_token`  

### 📍 Mapové prvky
- **Klastrování pinů** pro přehlednost  
- **Hladké animace** a efekty výběru pinu  
- Přepínání **sledování polohy** ↔ **manuální ovládání**  
- **Zaměřovací kříž** při hledání ze středu mapy  
- **Aura/pulse** efekt pro vizuální odezvu  

### 📱 Uživatelské rozhraní
- **Bottom sheet** s rozbalitelným seznamem  
- **Rychlé čipy radiusu** a **dok** se sliderem  
- **Světlé/Tmavé** téma (systém/ručně/force)  
- **CZ/EN** překlady  
- **Haptická** odezva  

### ⭐ Oblíbené & personalizace
- Až **3 oblíbené** myčky (lokální uložení)  
- **Preferovaná navigace**: Apple Maps / Google Maps / Waze / Zeptat se  
- Výchozí **radius** a **téma**  

### 🧭 Navigace
- **Jedno klepnutí** spustí navigaci  
- **Fallback** při chybě preferované aplikace  

---

## 🏗️ Architektura

### Základní struktura
iwash-app/
├── App.js                 # Hlavní komponenta
├── index.js               # Entry point
├── package.json           # Závislosti a skripty
├── eas.json               # Expo Application Services config
├── assets/                # Ikony a splash
└── src/                   # Zdrojové kódy

### Moduly v `src/`
src/
├── components/            # UI komponenty
│   ├── MainMapView.jsx          # Kontejner mapy
│   ├── MapViewClustered.jsx     # Klastrovaná mapa
│   ├── MarkersLayer.jsx         # Správa markerů
│   ├── MarkerPin.jsx            # Pin
│   ├── ClusterRenderer.jsx      # Vizualizace clusterů
│   ├── BottomSheetContainer.jsx # Wrapper bottom sheetu
│   ├── BottomSheetPanel.jsx     # Obsah bottom sheetu
│   ├── SearchControls.jsx       # Rozhraní vyhledávání
│   ├── TopBars.jsx              # Horní panely
│   ├── RadiusDock.jsx           # Ovládání radiusu
│   ├── QuickRadiusChips.jsx     # Rychlá volba radiusu
│   ├── FiltersRow.jsx           # Filtry
│   ├── PlaceCard.jsx            # Karta myčky
│   ├── ListHeader.jsx           # Hlavičky seznamu
│   ├── MeMarker.jsx             # Marker mé polohy
│   └── SettingsContainer.jsx    # Nastavení
├── hooks/                 # Vlastní hooky
│   ├── useLocationFollow.js     # Sledování polohy
│   ├── usePlacesSearch.js       # Google Places API
│   ├── useClustering.js         # Logika klastrů
│   ├── useFilteredPlaces.js     # Filtrování dat
│   ├── useFavorites.js          # Oblíbené
│   ├── useSettings.js           # Persistovaná nastavení
│   ├── useRadius.js             # Radius
│   ├── usePinSelection.js       # Výběr pinu
│   ├── usePlaceFocus.js         # Focus místa
│   ├── useVisibleCentering.js   # Centrovaní mapy
│   ├── useThemePalette.js       # Téma
│   ├── useSearchControls.js     # Ovládání vyhledávání
│   ├── useTopOcclusion.js       # Překryvy UI
│   ├── useClusterRadiusPx.js    # Výpočet radiusu klastru
│   └── useAuraPulse.js          # Vizuální efekt
├── services/
│   └── places.js                # Integrace Places API
├── utils/
│   ├── constants.js             # Konst
│   ├── geo.js                   # Geografické výpočty
│   ├── inferType.js             # Odvození typu myčky
│   ├── text.js                  # Normalizace textu
│   ├── clusterHandlers.js       # Handlery klastrů
│   ├── navigation.js            # Navigační utility
│   └── devlog.js                # Dev logování
├── i18n/
│   └── strings.js               # Překlady
├── styles/
│   └── appStyles.js             # Globální styly
└── debug/
├── DebugProvider.jsx        # Debug context
├── DebugOverlay.jsx         # Debug overlay
└── useDebug.js              # Debug hook

---

## 🚀 Začínáme

### Předpoklady
- Node.js **18+**  
- **Expo CLI** (`npm install -g @expo/cli`)  
- iOS Simulator / Android Emulator (volitelně) nebo fyzické zařízení s **Expo Go**

### Instalace
`bash`
`npm install`

Konfigurace prostředí

Vytvoř soubor .env v kořeni projektu:
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

Na Google Cloud Console povol Places API a Maps JavaScript API a klíč ideálně omez na bundleIdentifier.

### Spuštění
#### Dev server
npx expo start

#### iOS simulator
npx expo start --ios

#### Android emulator
npx expo start --android

#### Web (omezené funkce)
npx expo start --web

## 🔧 Vývoj & stack
	•	Expo SDK 53, React Native 0.79.5, React 19
	•	react-native-maps, react-native-map-clustering, @react-native-async-storage/async-storage, expo-location, expo-haptics
	•	Stav: React hooky, perzistence: AsyncStorage
	•	Výkon: klastrování, lazy loading, useMemo/useCallback, animace (Animated)

⸻

## 📱 Platformy
	•	iOS / Android: plná funkčnost (mapy, haptika, safe-area)
	•	Web: omezeno (bez GPS/haptiky)

⸻

## 🚧 Roadmap (výběr)
	•	Offline cache výsledků
	•	Pokročilé filtry (24/7, samoobsluha)
	•	Recenze/hodnocení
	•	Optimalizace tras
	•	Notifikace pro oblíbené
	•	Sociální prvky a analytika
	•	CI/CD, testy, monitoring, přístupnost

⸻

## 🚢 Build & TestFlight (iOS) ✈️

Pozn.: Pro TestFlight je nutný placený Apple Developer účet a záznam aplikace v App Store Connect s odpovídajícím Bundle ID.

1.	Připrav kredenciály
 `eas credentials`

	•	Platforma: iOS → profil: production
	•	Přihlásit k Apple účtu → Y
	•	Build credentials → All (vytvoří/načte certifikát a provisioning profil)

2.	Sestav produkční build
`eas build --platform ios`
	•	Build se zařadí do fronty a navýší se build number podle eas.json.

3.	Odešli build do App Store Connect / TestFlight
`eas submit --platform ios`
	•	Vyber poslední build, přihlas se k Apple a potvrď použití API key.

4.	Rozdej testerům

	•	V App Store Connect → TestFlight → vytvoř skupinu testerů
	•	Interní test: až 100 členů týmu (okamžitě)
	•	Externí test: až 10 000 testerů (první build verze prochází Beta App Review)

Tip: Pro zkrácení kroků lze použít:
`eas build --platform ios --auto-submit`
eas.json

Ujisti se, že v eas.json máš profil production a (volitelně) vyplněnou sekci:
`{
  "submit": {
    "production": {
      "ios": {
        "appleId": "TVUJ-APPLE-ID",
        "ascAppId": "TVUJ-APP-STORE-CONNECT-ID"
      }
    }
  }
}`

## 🤝 Contributing
	1.	Forkni repozitář
	2.	Vytvoř feature větev (git checkout -b feature/xyz)
	3.	Commitni změny (git commit -m "Add xyz")
	4.	Pushni větev (git push origin feature/xyz)
	5.	Otevři Pull Request

## 🙏 Poděkování
	•	Google Places API
	•	Expo tým
	•	Komunita React Native
	•	Autoři open-source knihoven
