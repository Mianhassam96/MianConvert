/**
 * Media Probe Cache
 *
 * Runs ONE analysis per file and caches the result globally.
 * All tools reuse it — no repeated probing.
 *
 * Since FFmpeg WASM doesn't expose ffprobe directly, we use
 * the browser's native HTMLVideoElement + HTMLAudioElement
 * for fast metadata extraction without any FFmpeg overhead.
 */

export interface MediaInfo {
  duration: number;
  width: number;
  height: number;
  /** Aspect ratio string e.g. "16:9" */
  aspectRatio: string;
  /** File size in bytes */
  size: number;
  /** File extension lowercase */
  ext: string;
  /** MIME type */
  mime: string;
  /** Whether file likely has audio */
  hasAudio: boolean;
  /** Whether file is portrait (height > width) */
  isPortrait: boolean;
  /** Estimated bitrate kbps */
  bitrateKbps: number;
  /** Object URL for preview — caller must revoke when done */
  previewUrl: string;
}

// Cache keyed by file name + size + lastModified
const cache = new Map<string, MediaInfo>();

const cacheKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const getAspectRatio = (w: number, h: number): string => {
  if (!w || !h) return "unknown";
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
};

const NO_AUDIO_EXTS = ["gif", "apng"];

/**
 * Probe a media file using the browser's native media element.
 * Returns cached result if already probed.
 */
export const probeFile = (file: File): Promise<MediaInfo> => {
  const key = cacheKey(file);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);

  return new Promise((resolve) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isAudioFile = file.type.startsWith("audio/");
    const previewUrl = URL.createObjectURL(file);

    const el = isAudioFile
      ? document.createElement("audio")
      : document.createElement("video");

    el.preload = "metadata";
    el.muted = true;

    const finish = () => {
      const duration = isFinite(el.duration) ? el.duration : 0;
      const width  = (el as HTMLVideoElement).videoWidth  ?? 0;
      const height = (el as HTMLVideoElement).videoHeight ?? 0;
      const bitrateKbps = duration > 0
        ? Math.round((file.size * 8) / duration / 1000)
        : 0;

      const info: MediaInfo = {
        duration,
        width,
        height,
        aspectRatio: getAspectRatio(width, height),
        size: file.size,
        ext,
        mime: file.type,
        hasAudio: !NO_AUDIO_EXTS.includes(ext) && !isAudioFile,
        isPortrait: height > width,
        bitrateKbps,
        previewUrl,
      };

      cache.set(key, info);
      el.src = "";
      resolve(info);
    };

    el.onloadedmetadata = finish;
    el.onerror = () => {
      // Fallback with minimal info
      const info: MediaInfo = {
        duration: 0, width: 0, height: 0,
        aspectRatio: "unknown", size: file.size,
        ext, mime: file.type,
        hasAudio: !NO_AUDIO_EXTS.includes(ext),
        isPortrait: false, bitrateKbps: 0,
        previewUrl,
      };
      cache.set(key, info);
      resolve(info);
    };

    el.src = previewUrl;
  });
};

/**
 * Get cached info synchronously (returns null if not yet probed).
 */
export const getCachedInfo = (file: File): MediaInfo | null => {
  return cache.get(cacheKey(file)) ?? null;
};

/**
 * Clear the probe cache and revoke all cached preview URLs.
 */
export const clearProbeCache = (): void => {
  for (const info of cache.values()) {
    try { URL.revokeObjectURL(info.previewUrl); } catch {}
  }
  cache.clear();
};
