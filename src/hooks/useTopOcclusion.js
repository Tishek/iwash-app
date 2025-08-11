import { useState } from 'react';

export function useTopOcclusion() {
  const [topUiBottomY, setTopUiBottomY] = useState(0);
  const registerTopOcclusion = (e) => {
    const ly = e?.nativeEvent?.layout;
    if (!ly) return;
    const bottom = (ly.y || 0) + (ly.height || 0);
    setTopUiBottomY((prev) => Math.max(prev, bottom));
  };
  return { topUiBottomY, registerTopOcclusion };
}


