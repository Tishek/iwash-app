import React, { useContext, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DebugContext } from './DebugProvider';

export default function DebugOverlay({ styles }) {
  const { showOverlay, toggleOverlay, logs, clearLogs, captureConsole, setCaptureConsole, logLevel, setLogLevel, setOverlayRendering } = useContext(DebugContext);
  // Hooks must not be conditional: compute filtered always, render conditionally later
  const filtered = useMemo(() => {
    try { return logs.filter(l => levelAllowed(l.level, logLevel)); }
    catch { return []; }
  }, [logs, logLevel]);
  // Označ aktivní vykreslení overlaye (zamezí state update během renderu)
  useEffect(() => {
    setOverlayRendering(!!showOverlay);
    return () => setOverlayRendering(false);
  }, [showOverlay, setOverlayRendering]);
  if (!showOverlay) return null;
  return (
    <View style={[overlayStyles.wrap]}>
      <View style={overlayStyles.header}>
        <Text style={overlayStyles.title}>Debug</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setCaptureConsole(v => !v)} style={overlayStyles.btn}>
            <Text style={overlayStyles.btnTxt}>{captureConsole ? 'Console: ON' : 'Console: OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => cycleLevel(setLogLevel, logLevel)} style={overlayStyles.btn}>
            <Text style={overlayStyles.btnTxt}>Level: {logLevel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearLogs} style={overlayStyles.btn}>
            <Text style={overlayStyles.btnTxt}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleOverlay} style={overlayStyles.btn}>
            <Text style={overlayStyles.btnTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={overlayStyles.body} contentContainerStyle={{ padding: 12 }}>
        {filtered.length === 0 ? (
          <Text style={overlayStyles.empty}>No logs</Text>
        ) : filtered.map((l) => (
          <Text key={l.id} style={[overlayStyles.row, colorFor(l.level)]}>
            [{l.level}] {l.ts} — {l.text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

function cycleLevel(setter, current) {
  const order = ['log', 'info', 'warn', 'error'];
  const idx = order.indexOf(current);
  const next = order[(idx + 1) % order.length];
  setter(next);
}
function levelAllowed(level, minLevel) {
  const order = ['log', 'info', 'warn', 'error'];
  return order.indexOf(level) >= order.indexOf(minLevel);
}
function colorFor(level) {
  const base = { fontFamily: 'System', fontSize: 12 };
  switch (level) {
    case 'error': return { ...base, color: '#F97066' };
    case 'warn': return { ...base, color: '#F79009' };
    case 'info': return { ...base, color: '#7CD4FD' };
    default: return { ...base, color: '#E6E9F2' };
  }
}

const overlayStyles = {
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2,6,23,0.95)', zIndex: 9999 },
  header: { paddingTop: 48, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontWeight: '900', fontSize: 16 },
  btn: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnTxt: { color: '#E5E7EB', fontWeight: '800', fontSize: 12 },
  body: { flex: 1 },
  row: { marginBottom: 6 },
  empty: { color: '#94A3B8', fontStyle: 'italic' },
};
