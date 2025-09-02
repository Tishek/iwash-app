export const STRINGS = {
  cs: {
    updating: 'Aktualizuji…',
    settings: 'Nastavení',
    done: 'Hotovo',
    listTitle: 'Myčky v okolí',
    radius: 'radius',
    error: 'chyba',
    filters: {
      ALL: 'Vše',
      CONTACT: 'Kontaktní',
      NONCONTACT: 'Bezkontaktní',
      FULLSERVICE: 'Full service',
      FAV: 'Oblíbené',
    },
    searchCenter: 'Střed vyhledávání',
    myLocation: 'Moje poloha',
    mapCenter: 'Střed mapy',
    prefNav: 'Preferovaná navigace',
    theme: 'Vzhled',
    defaultRadius: 'Výchozí radius',
    defaultRadiusHint: 'Použije se při startu a když posuneš jezdec zde',
    search: 'Hledat',
    empty: 'Žádné výsledky pro zvolený filtr. Změň poloměr, filtr, nebo ťukni na „Hledat zde“.',
    language: 'Jazyk',
    langCs: 'Čeština',
    langEn: 'English',
    cacheBadge: 'Z cache',
    units: { km: 'km', m: 'm', min: 'min' },
    open: 'Otevřeno',
    closed: 'Zavřeno',
    btn: { navigate: 'Navigovat' },
    common: {
      cancel: 'Zrušit',
      missingKeyTitle: 'Chybí API klíč',
      missingKeyBody: 'Přidej EXPO_PUBLIC_GOOGLE_MAPS_API_KEY do .env a restartuj.',
      loadErrorTitle: 'Chyba načítání',
      invalidDestinationTitle: 'Chyba',
      invalidDestinationBody: 'Cíl nemá platnou polohu.',
      navOpenFailTitle: 'Nejde otevřít navigaci',
      navOpenFailBody: 'Zkus jinou aplikaci.',
      destinationLabel: 'Cíl'
    },
    nav: {
      otherApp: 'Otevřít v jiné aplikaci',
      chooseApp: 'Vyber navigační aplikaci',
      apple: 'Apple',
      google: 'Google',
      waze: 'Waze',
      ask: 'Zeptat se',
    },
    themeSystem: 'Systém',
    themeLight: 'Světlý',
    themeDark: 'Tmavý'
  },
  en: {
    updating: 'Updating…',
    settings: 'Settings',
    done: 'Done',
    listTitle: 'Car washes nearby',
    radius: 'radius',
    error: 'error',
    filters: {
      ALL: 'All',
      CONTACT: 'Contact',
      NONCONTACT: 'Touchless',
      FULLSERVICE: 'Full service',
      FAV: 'Favorites',
    },
    searchCenter: 'Search center',
    myLocation: 'My location',
    mapCenter: 'Map center',
    prefNav: 'Preferred navigation',
    theme: 'Appearance',
    defaultRadius: 'Default radius',
    defaultRadiusHint: 'Used on app start and when you move the slider here',
    search: 'Search',
    empty: 'No results for the selected filter. Change the radius, filter, or tap “Search here”.',
    language: 'Language',
    langCs: 'Čeština',
    langEn: 'English',
    units: { km: 'km', m: 'm', min: 'min' },
    cacheBadge: 'From cache',
    open: 'Open',
    closed: 'Closed',
    btn: { navigate: 'Navigate' },
    common: {
      cancel: 'Cancel',
      missingKeyTitle: 'Missing API key',
      missingKeyBody: 'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env and restart.',
      loadErrorTitle: 'Loading error',
      invalidDestinationTitle: 'Error',
      invalidDestinationBody: 'Destination has no valid location.',
      navOpenFailTitle: "Can't open navigation",
      navOpenFailBody: 'Try another app.',
      destinationLabel: 'Destination'
    },
    nav: {
      otherApp: 'Open in another app',
      chooseApp: 'Choose a navigation app',
      apple: 'Apple',
      google: 'Google',
      waze: 'Waze',
      ask: 'Ask me',
    },
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark'
  },
};

export function createTranslator(lang) {
  const safeLang = lang === 'en' ? 'en' : 'cs';
  return (key, fallback) => {
    const parts = String(key).split('.');
    let cur = STRINGS[safeLang];
    for (const p of parts) cur = cur?.[p];
    return (typeof cur === 'string') ? cur : (fallback ?? key);
  };
}
