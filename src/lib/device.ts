export type DeviceType = "mobile" | "tablet" | "desktop";

export const detectDevice = (): DeviceType => {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPod/.test(ua)) return "mobile";
  if (/iPad|Tablet/.test(ua)) return "tablet";
  return "desktop";
};

// Recommended format per device
export const recommendedFormat = (device: DeviceType): string => {
  if (device === "mobile") return "mp4"; // widest mobile support
  if (device === "tablet") return "mp4";
  return "webm"; // desktop browsers handle webm well
};

// Recommended resolution per device
export const recommendedResolution = (device: DeviceType): string => {
  if (device === "mobile") return "480p";
  if (device === "tablet") return "720p";
  return "1080p";
};
