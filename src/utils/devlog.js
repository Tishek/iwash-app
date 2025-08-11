export const DEV_LOG = (...args) => { if (__DEV__) { try { console.log(...args); } catch {} } };
export const DEV_WARN = (...args) => { if (__DEV__) { try { console.warn(...args); } catch {} } };
export const DEV_INFO = (...args) => { if (__DEV__) { try { (console.info || console.log)(...args); } catch {} } };
export const DEV_ERROR = (...args) => { if (__DEV__) { try { console.error(...args); } catch {} } };


