/**
 * Device Parser - חילוץ מידע על device/browser מ-User-Agent
 */

export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  browser: string;
  browser_version?: string;
  os: string;
  os_version?: string;
  is_mobile: boolean;
  is_tablet: boolean;
  is_desktop: boolean;
}

/**
 * חילוץ מידע על device/browser מ-User-Agent
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Device type
  const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /tablet|ipad|playbook|silk/i.test(ua);
  const isBot = /bot|crawler|spider|crawling/i.test(ua);
  
  let device_type: DeviceInfo['device_type'] = 'unknown';
  if (isBot) {
    device_type = 'bot';
  } else if (isMobile) {
    device_type = 'mobile';
  } else if (isTablet) {
    device_type = 'tablet';
  } else {
    device_type = 'desktop';
  }

  // Browser
  let browser = 'Unknown';
  let browser_version: string | undefined;
  
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    browser_version = match ? match[1] : undefined;
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    browser_version = match ? match[1] : undefined;
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    browser_version = match ? match[1] : undefined;
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/([\d.]+)/);
    browser_version = match ? match[1] : undefined;
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
    const match = ua.match(/(?:opera|opr)\/([\d.]+)/);
    browser_version = match ? match[1] : undefined;
  }

  // OS
  let os = 'Unknown';
  let os_version: string | undefined;
  
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) os_version = '10';
    else if (ua.includes('windows nt 6.3')) os_version = '8.1';
    else if (ua.includes('windows nt 6.2')) os_version = '8';
    else if (ua.includes('windows nt 6.1')) os_version = '7';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    os = 'macOS';
    const match = ua.match(/mac os x ([\d_]+)/);
    os_version = match ? match[1].replace(/_/g, '.') : undefined;
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android ([\d.]+)/);
    os_version = match ? match[1] : undefined;
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os ([\d_]+)/);
    os_version = match ? match[1].replace(/_/g, '.') : undefined;
  }

  return {
    device_type,
    browser,
    browser_version,
    os,
    os_version,
    is_mobile: isMobile,
    is_tablet: isTablet,
    is_desktop: !isMobile && !isTablet && !isBot,
  };
}

