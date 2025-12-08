import { SectionSettings, StyleSettings } from './types';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * Returns the effective settings for a section based on the current device.
 * It merges desktop settings with device-specific overrides.
 */
export function getResponsiveSettings(section: SectionSettings, device: DeviceType): Record<string, any> {
  const baseSettings = section.settings || {};
  
  if (device === 'desktop') {
    return baseSettings;
  }

  // Cast to any because 'responsive' might not be fully typed in SectionSettings interface yet
  // or TypeScript might not pick it up if not strictly defined in all places
  const responsive = (section as any).responsive || {};
  const deviceOverrides = responsive[device]?.settings || {};

  // For settings, we typically override specific keys. 
  // If a key is missing in override, we fall back to base.
  return { ...baseSettings, ...deviceOverrides };
}

/**
 * Returns the effective style for a section based on the current device.
 * It merges desktop styles with device-specific overrides.
 */
export function getResponsiveStyle(section: SectionSettings, device: DeviceType): StyleSettings {
  const baseStyle = section.style || {};
  
  if (device === 'desktop') {
    return baseStyle;
  }

  const responsive = (section as any).responsive || {};
  const deviceOverrides = responsive[device]?.style || {};

  // Deep merge would be better here for nested objects like 'background', 'typography' etc.
  // For now, simple spread. In a real app, use lodash.merge or structuredClone
  // We will do a shallow merge of top-level style categories
  
  const mergedStyle: any = { ...baseStyle };

  Object.keys(deviceOverrides).forEach(key => {
    if (typeof deviceOverrides[key] === 'object' && deviceOverrides[key] !== null && !Array.isArray(deviceOverrides[key])) {
        mergedStyle[key] = { ...mergedStyle[key], ...deviceOverrides[key] };
    } else {
        mergedStyle[key] = deviceOverrides[key];
    }
  });

  return mergedStyle;
}

