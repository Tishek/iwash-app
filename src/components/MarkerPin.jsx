import React from 'react';
import { Animated, View, Text } from 'react-native';
import { appStyles as styles } from '../styles/appStyles';

function MarkerPin({ selected, color, scale, fav }) {
  return (
    <Animated.View style={[styles.pinWrap, { transform: [{ scale }] }]}>
      {selected && <View style={[styles.pinGlow, { borderColor: color }]} />}
      <View style={[styles.pinTop, { backgroundColor: color }]} />
      <View style={[styles.pinStem, { backgroundColor: color }]} />
      {fav && (
        <View style={styles.pinFav}>
          <Text style={styles.pinFavTxt}>★</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default React.memo(MarkerPin, (a, b) => (
  a.selected === b.selected && a.color === b.color && a.scale === b.scale && a.fav === b.fav
));
