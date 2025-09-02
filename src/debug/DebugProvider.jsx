import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { breadcrumb } from '../utils/crashTrace';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DebugContext = createContext(null);

const STORAGE_KEY = 'iwash_debug_prefs_v1';
const MAX_LOGS = 250;

export function DebugProvider({ children }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [captureConsole, setCaptureConsole] = useState(true);
  const [logLevel, setLogLevel] = useState('warn');
  const [logs, setLogs] = useState([]);

  const originalsRef = useRef({});

  // Load persisted prefs
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (typeof p.showOverlay === 'boolean') setShowOverlay(p.showOverlay);
          if (typeof p.captureConsole === 'boolean') setCaptureConsole(p.captureConsole);
          if (typeof p.logLevel === 'string') setLogLevel(p.logLevel);
        }
      } catch {}
    })();
  }, []);

  // Persist prefs
  useEffect(() => {
    const prefs = { showOverlay, captureConsole, logLevel };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [showOverlay, captureConsole, logLevel]);

  const addLog = useCallback((level, ...msgs) => {
    const time = new Date();
    const entry = { id: `${time.getTime()}-${Math.random().toString(36).slice(2)}`, ts: time.toISOString(), level, text: msgs.map(m => stringifySafe(m)).join(' ') };
    setLogs(prev => {
      const next = [...prev, entry];
      if (next.length > MAX_LOGS) next.splice(0, next.length - MAX_LOGS);
      return next;
    });
  }, []); // empty deps to prevent re-creation

  const clearLogs = useCallback(() => setLogs([]), []);
  const toggleOverlay = useCallback(() => setShowOverlay(v => !v), []);

  // Console patching (dev only) - with guard against re-patching
  useEffect(() => {
    if (!__DEV__) return;
    // Patchneme vždy; log/info zapisujeme jen pokud je overlay otevřený a capture zapnutý
    if (originalsRef.current.patched) return; // prevent re-patching
    
    const orig = {
      log: console.log,
      info: console.info || console.log,
      warn: console.warn,
      error: console.error,
    };
    originalsRef.current = { ...orig, patched: true };
    
    // Use a stable reference to addLog to prevent setState during render
    const stableAddLog = (level, ...args) => {
      // Use setTimeout to defer the setState call and avoid setState during render
      setTimeout(() => {
        const time = new Date();
        const entry = { 
          id: `${time.getTime()}-${Math.random().toString(36).slice(2)}`, 
          ts: time.toISOString(), 
          level, 
          text: args.map(m => stringifySafe(m)).join(' ') 
        };
        setLogs(prev => {
          const next = [...prev, entry];
          if (next.length > MAX_LOGS) next.splice(0, next.length - MAX_LOGS);
          return next;
        });
      }, 0);
    };
    
    console.log = (...args) => {
      try { orig.log?.(...args); } catch {}
      if (showOverlay && captureConsole) stableAddLog('log', ...args);
    };
    console.info = (...args) => {
      try { orig.info?.(...args); } catch {}
      if (showOverlay && captureConsole) stableAddLog('info', ...args);
    };
    // warn/error vždy zapisujeme (kvůli pádům)
    console.warn = (...args) => { try { orig.warn?.(...args); } catch {} stableAddLog('warn', ...args); try { breadcrumb('warn', args.map(a => stringifySafe(a)).join(' ')); } catch {} };
    console.error = (...args) => { try { orig.error?.(...args); } catch {} stableAddLog('error', ...args); try { breadcrumb('error', args.map(a => stringifySafe(a)).join(' ')); } catch {} };
    
    return () => {
      try {
        if (originalsRef.current?.log) console.log = originalsRef.current.log;
        if (originalsRef.current?.info) console.info = originalsRef.current.info;
        if (originalsRef.current?.warn) console.warn = originalsRef.current.warn;
        if (originalsRef.current?.error) console.error = originalsRef.current.error;
        originalsRef.current.patched = false;
      } catch {}
    };
  }, [captureConsole, showOverlay]);

  const value = useMemo(() => ({
    showOverlay,
    setShowOverlay,
    toggleOverlay,
    captureConsole,
    setCaptureConsole,
    logLevel,
    setLogLevel,
    logs,
    addLog,
    clearLogs,
  }), [showOverlay, captureConsole, logLevel, logs, addLog, clearLogs, toggleOverlay]);

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

function stringifySafe(v) {
  try {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    return JSON.stringify(v);
  } catch {
    try { return String(v); } catch { return '[unserializable]'; }
  }
}
