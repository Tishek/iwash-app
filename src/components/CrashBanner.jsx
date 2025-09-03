import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CrashBanner({ report, onClose }) {
  if (!report) return null;
  const { title = 'Aplikace byla minule ukončena', detail, list } = report;
  return (
    <View style={s.wrap} pointerEvents="box-none">
      <View style={s.banner}>
        <Text style={s.title}>{title}</Text>
        {detail ? <Text style={s.detail} numberOfLines={2}>{detail}</Text> : null}
        {Array.isArray(list) && list.length > 0 && (
          <View style={{ marginTop: 6 }}>
            {list.slice(-5).map((row, i) => (
              <Text key={`cr-${i}`} style={s.row}>{row}</Text>
            ))}
          </View>
        )}
        <TouchableOpacity onPress={onClose} style={s.btn} accessibilityLabel="Zavřít">
          <Text style={s.btnTxt}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10000, alignItems: 'center' },
  banner: { marginTop: 46, maxWidth: 520, width: '94%', backgroundColor: '#111827', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  title: { color: '#F79009', fontWeight: '900', fontSize: 14 },
  detail: { color: '#E5E7EB', marginTop: 4, fontSize: 12 },
  row: { color: '#CBD5E1', fontSize: 11, marginTop: 2 },
  btn: { position: 'absolute', right: 10, top: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#334155' },
  btnTxt: { color: '#E5E7EB', fontWeight: '800', fontSize: 12 },
});
