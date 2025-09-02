export function buildNavigationUrl({ latitude, longitude }, app = 'google', label = 'Destination') {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return '';
  const encodedLabel = encodeURIComponent(label || 'Destination');
  switch (app) {
    case 'apple':
      return `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`;
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    case 'waze':
      return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    default:
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
}

export async function openNavigationTo(item, preferredApp, t, Linking, Alert) {
  const loc = item?.location;
  if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
    Alert?.alert?.(t?.('common.invalidDestinationTitle') ?? 'Invalid destination', t?.('common.invalidDestinationBody') ?? 'Selected place has no valid coordinates.');
    return;
  }
  const url = buildNavigationUrl(loc, preferredApp || 'google', item?.name || t?.('common.destinationLabel') || 'Destination');
  try {
    await Linking?.openURL?.(url);
  } catch {
    Alert?.alert?.(t?.('common.navOpenFailTitle') ?? 'Failed to open navigation', t?.('common.navOpenFailBody') ?? 'Please try another app.');
  }
}


