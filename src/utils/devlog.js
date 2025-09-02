// Show only warnings and errors in dev to reduce noise/crashes in Expo Go
const ENABLE_LOG = false;
const ENABLE_INFO = false;

export const DEV_LOG = (...args) => { if (__DEV__ && ENABLE_LOG) { try { console.log(...args); } catch {} } };
export const DEV_INFO = (...args) => { if (__DEV__ && ENABLE_INFO) { try { (console.info || console.log)(...args); } catch {} } };
export const DEV_WARN = (...args) => { if (__DEV__) { try { console.warn(...args); } catch {} } };
export const DEV_ERROR = (...args) => { if (__DEV__) { try { console.error(...args); } catch {} } };

