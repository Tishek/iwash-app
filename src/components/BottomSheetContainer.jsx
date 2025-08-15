import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheetPanel from './BottomSheetPanel.jsx'; // nebo './BottomSheetPanel.jsx' pokud je soubor s příponou

console.log('BottomSheetContainer file loaded');

export default function BottomSheetContainer({ onSheetIndexChange, ...rest }) {
  console.count('BottomSheetContainer render');
  return (
    // Wrapper přes celou obrazovku a nad mapou/ovladači
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]} pointerEvents="box-none">
      <BottomSheetPanel {...rest} onSheetIndexChange={onSheetIndexChange} />
    </View>
  );
}