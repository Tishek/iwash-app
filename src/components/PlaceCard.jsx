import React from 'react';
import { TouchableOpacity, View, Text, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { appStyles as styles } from '../styles/appStyles';

function PlaceCard({
  item,
  selected,
  isDark,
  P,
  settings,
  isFav,
  toggleFav,
  onNavigatePreferred,
  openNavigation,
  focusPlace,
  t
}) {
  // i18n helper
  const tt = (key, fallback) => (typeof t === 'function' ? t(key) : fallback);

  // typ myčky (štítek)
  const typeLabel =
    item?.inferredType === 'NONCONTACT'
      ? tt('filters.NONCONTACT', 'Touchless')
      : item?.inferredType === 'FULLSERVICE'
      ? tt('filters.FULLSERVICE', 'Full service')
      : item?.inferredType === 'CONTACT'
      ? tt('filters.CONTACT', 'Contact')
      : tt('filters.ALL', 'All');

  // vzdálenost
  const kmSuffix = tt('units.km', 'km');
  const mSuffix = tt('units.m', 'm');
  const distanceText =
    item?.distanceM >= 1000
      ? `${(item.distanceM / 1000).toFixed(1)} ${kmSuffix}`
      : `${item?.distanceM ?? ''} ${mSuffix}`;

  // --- novinky: zvýraznění vybrané karty a kontrast textů ---
  const cardBg = selected
    ? (isDark ? 'rgba(255,255,255,0.08)' : '#F2F4F7')   // jemné zesvětlení v dark, světle šedá v light
    : P.surface;

  const cardBorder = selected
    ? (isDark ? 'rgba(255,255,255,0.20)' : '#E5E7EB')
    : P.border;

  // badge barvy (lepší kontrast v dark pro CONTACT)
  const badgeBg =
    item?.inferredType === 'NONCONTACT' ? (isDark ? 'rgba(46,144,250,0.15)' : '#E8F2FF') :
    item?.inferredType === 'FULLSERVICE' ? (isDark ? 'rgba(18,183,106,0.15)' : '#E9F8EF') :
    item?.inferredType === 'CONTACT' ? (isDark ? 'rgba(255,255,255,0.12)' : '#EEE') :
    (isDark ? '#1C2435' : '#F1F5F9');

  const badgeColor =
    item?.inferredType === 'NONCONTACT' ? '#2E90FA' :
    item?.inferredType === 'FULLSERVICE' ? '#12B76A' :
    item?.inferredType === 'CONTACT' ? (isDark ? '#FFFFFF' : '#111') :
    (isDark ? 'rgba(255,255,255,0.8)' : '#475569');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderWidth: isDark ? 1 : (selected ? 1 : 0),
        }
        // záměrně NEpoužíváme styles.cardActive, aby texty zůstaly P.text/P.textMute
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        focusPlace(item);
      }}
      accessibilityLabel={tt('a11y.openPlace', 'Open place details')}
    >
      <View style={{ flex: 1 }}>
        {/* Titulek + oblíbené */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.cardTitle, { color: P.text }]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => toggleFav(item, (settings?.lang === 'en' ? 'en' : 'cs'))}
            style={styles.favBtn}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
            accessibilityLabel={
              isFav(item.id)
                ? tt('a11y.removeFavorite', 'Remove from favorites')
                : tt('a11y.addFavorite', 'Add to favorites')
            }
          >
            <Text style={[styles.favIcon, isFav(item.id) && styles.favIconActive]}>★</Text>
          </TouchableOpacity>
        </View>

        {/* Štítek typu */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeTxt, { color: badgeColor }]}>
              {typeLabel}
            </Text>
          </View>
        </View>

        {/* Adresa */}
        <Text style={[styles.cardSub, { color: P.textMute }]} numberOfLines={1}>
          {item.address}
        </Text>

        {/* Meta řádek */}
        <View style={styles.metaRow}>
          <Text style={[styles.cardMeta, { color: P.textMute }]}>
            {distanceText}
            {item.rating ? ` • ★ ${item.rating} (${item.userRatingsTotal || 0})` : ''}
          </Text>

          {item.openNow !== null && (
            <View style={styles.openBadge}>
              <View
                style={[
                  styles.openDot,
                  { backgroundColor: item.openNow ? '#12B76A' : '#94A3B8' }
                ]}
              />
              <Text style={[styles.openTxt, { color: P.textMute }]}>
                {item.openNow ? tt('open', 'Open') : tt('closed', 'Closed')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Navigační tlačítka */}
      <View style={styles.navRow}>
        {settings?.preferredNav && settings.preferredNav !== 'ask' ? (
          <TouchableOpacity
            onPress={() => onNavigatePreferred(item)}
            style={styles.navBtn}
            accessibilityLabel={tt('a11y.navigate', 'Navigate')}
          >
            <Text style={styles.navTxt}>{tt('btn.navigate', 'Navigovat')}</Text>
          </TouchableOpacity>
        ) : (
          (() => {
            const navs = [
              { key: 'apple',  label: tt('nav.apple', 'Apple') },
              { key: 'google', label: tt('nav.google', 'Google') },
              { key: 'waze',   label: tt('nav.waze', 'Waze') },
            ];
            return navs.map((n) => (
              <TouchableOpacity
                key={n.key}
                onPress={() => openNavigation(item, n.key)}
                style={styles.navBtn}
                accessibilityLabel={n.label}
              >
                <Text style={styles.navTxt}>{n.label}</Text>
              </TouchableOpacity>
            ));
          })()
        )}
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(PlaceCard, (prev, next) => {
  // Rerender jen když se změní identita položky, výběr, nebo relevantní vizuální props
  return (
    prev.item?.id === next.item?.id &&
    prev.selected === next.selected &&
    prev.isDark === next.isDark &&
    prev.P?.bg === next.P?.bg &&
    prev.P?.text === next.P?.text &&
    prev.P?.textMute === next.P?.textMute &&
    prev.settings?.preferredNav === next.settings?.preferredNav &&
    prev.isFav?.(prev.item?.id) === next.isFav?.(next.item?.id)
  );
});
