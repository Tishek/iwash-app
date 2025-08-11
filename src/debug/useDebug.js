import { useContext } from 'react';
import { DebugContext } from './DebugProvider';

export function useDebug() {
  return useContext(DebugContext);
}


