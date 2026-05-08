/**
 * FFmpeg Pipeline Engine
 *
 * Provides:
 * 1. Fast Path detection — uses -c copy when no re-encode is needed (10–50x faster)
 * 2. Smart preset tuning — correct CRF, preset, scale flags
 * 3. Operation composer — builds optimal single-pass FFmpeg args
 * 4. Memory cleanup helpers — explicit file + blob cleanup
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RenderMode = "instant" | "balanced" | "quality";

export interface PipelineOptions {
  /** Input filename already written to FFmpeg FS */
  inputName: string;
  /** Output filename */
  outputName: string;
  /** Trim: start seconds */
  trimStart?: number;
  /** Trim: end seconds */
  trimEnd?: number;
  /** Video filters (scale, crop, etc.) */
  vFilters?: string[];
  /** Audio filters */
  aFilters?: string[];
  /** Remove audio entirely */
  muteAudio?: boolean;
  /** Remove video (audio-only output) */
  videoOnly?: boolean;
  /** Output container codec hint */
  outputFormat?: "mp4" | "webm" | "mp3" | "wav" | "gif";
  /** Quality mode */
  mode?: RenderMode;
  /** CRF override (overrides mode) */
  crfOverride?: string;
  /** Force re-encode even if fast path is possible */
  forceEncode?: boolean;
}

// ── Fast Path Detection ───────────────────────────────────────────────────────

/**
 * Returns true if the operation can use stream copy (-c copy).
 * Fast path = no filters, no re-encode needed, same container family.
 */
export const canUseFastPath = (opts: PipelineOptions): boolean => {
  if (opts.forceEncode) return false;
  if (opts.vFilters?.length) return false;
  if (opts.aFilters?.length) return false;
  if (opts.outputFormat === "mp3" || opts.outputFormat === "wav") return false;
  if (opts.outputFormat === "gif") return false;
  if (opts.outputFormat === "webm") return false; // needs re-encode
  // Trim-only on same container = fast path
  return true;
};

// ── Preset Tuning ─────────────────────────────────────────────────────────────

const MODE_PRESETS: Record<RenderMode, { crf: string; preset: string }> = {
  instant:  { crf: "28", preset: "ultrafast" },
  balanced: { crf: "26", preset: "fast" },
  quality:  { crf: "20", preset: "medium" },
};

// ── Command Builder ───────────────────────────────────────────────────────────

/**
 * Builds the optimal FFmpeg args array for a given operation.
 * Automatically selects fast path or re-encode path.
 */
export const buildFFmpegArgs = (opts: PipelineOptions): { args: string[]; fastPath: boolean } => {
  const {
    inputName, outputName,
    trimStart, trimEnd,
    vFilters = [], aFilters = [],
    muteAudio, videoOnly,
    outputFormat = "mp4",
    mode = "balanced",
    crfOverride,
  } = opts;

  const fast = canUseFastPath(opts);
  const { crf, preset } = MODE_PRESETS[mode];
  const effectiveCrf = crfOverride ?? crf;

  const args: string[] = [];

  // Trim flags BEFORE -i for faster seeking (input seeking)
  if (trimStart !== undefined && trimStart > 0) {
    args.push("-ss", trimStart.toFixed(3));
  }

  args.push("-i", inputName);

  // Trim end
  if (trimEnd !== undefined && trimStart !== undefined) {
    args.push("-t", (trimEnd - trimStart).toFixed(3));
  } else if (trimEnd !== undefined) {
    args.push("-to", trimEnd.toFixed(3));
  }

  if (fast) {
    // ── FAST PATH: stream copy ──────────────────────────────────────────────
    if (muteAudio) {
      args.push("-an", "-c:v", "copy");
    } else {
      args.push("-c", "copy");
    }
  } else {
    // ── ENCODE PATH ────────────────────────────────────────────────────────
    if (outputFormat === "mp3") {
      args.push("-vn", "-acodec", "libmp3lame", "-q:a", "2");
    } else if (outputFormat === "wav") {
      args.push("-vn", "-acodec", "pcm_s16le");
    } else if (outputFormat === "webm") {
      const allVf = [...vFilters];
      if (allVf.length) args.push("-vf", allVf.join(","));
      args.push("-c:v", "libvpx-vp9", "-crf", effectiveCrf, "-b:v", "0");
      if (muteAudio) args.push("-an");
      else args.push("-c:a", "libopus");
    } else {
      // MP4 / default
      const allVf = [...vFilters];
      if (allVf.length) args.push("-vf", allVf.join(","));

      const allAf = [...aFilters];
      if (allAf.length && !muteAudio) args.push("-af", allAf.join(","));

      args.push("-c:v", "libx264", "-crf", effectiveCrf, "-preset", preset);

      if (muteAudio) {
        args.push("-an");
      } else if (videoOnly) {
        args.push("-an");
      } else {
        args.push("-c:a", "aac", "-b:a", "128k");
      }

      // Avoid odd dimensions — only add if no scale filter already present
      if (!allVf.some(f => f.includes("scale"))) {
        // Append to existing -vf or add new one
        const vfIdx = args.indexOf("-vf");
        if (vfIdx !== -1) {
          args[vfIdx + 1] = args[vfIdx + 1] + ",scale=trunc(iw/2)*2:trunc(ih/2)*2";
        } else {
          args.push("-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2");
        }
      }
    }
  }

  // Avoid re-encoding warnings — only needed for re-encode path
  if (!fast) {
    args.push("-avoid_negative_ts", "make_zero");
  }
  args.push(outputName);

  return { args, fastPath: fast };
};

// ── Memory Cleanup ────────────────────────────────────────────────────────────

/**
 * Safely delete a file from FFmpeg FS. Never throws.
 */
export const safeDelete = async (ff: FFmpeg, name: string): Promise<void> => {
  try { await ff.deleteFile(name); } catch {}
};

/**
 * Delete multiple files from FFmpeg FS.
 */
export const cleanupFiles = async (ff: FFmpeg, names: string[]): Promise<void> => {
  await Promise.all(names.map(n => safeDelete(ff, n)));
};

/**
 * Revoke a list of object URLs to free browser memory.
 */
export const revokeUrls = (...urls: (string | null | undefined)[]): void => {
  for (const url of urls) {
    if (url) { try { URL.revokeObjectURL(url); } catch {} }
  }
};

// ── Scale Filter Builder ──────────────────────────────────────────────────────

/**
 * Build a scale filter that:
 * - Maintains aspect ratio
 * - Avoids odd dimensions (libx264 requirement)
 * - Uses lanczos for quality, bilinear for speed
 */
export const buildScaleFilter = (
  targetW: number | "original",
  targetH: number | "original",
  mode: RenderMode = "balanced"
): string | null => {
  if (targetW === "original" && targetH === "original") return null;
  const flags = mode === "instant" ? "bilinear" : "lanczos";
  if (targetW !== "original" && targetH !== "original") {
    return `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease:flags=${flags},pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2`;
  }
  if (targetW !== "original") return `scale=${targetW}:-2:flags=${flags}`;
  return `scale=-2:${targetH}:flags=${flags}`;
};

// ── Resolution Presets ────────────────────────────────────────────────────────

export const RESOLUTION_MAP: Record<string, { w: number; h: number }> = {
  "4k":     { w: 3840, h: 2160 },
  "1080p":  { w: 1920, h: 1080 },
  "720p":   { w: 1280, h: 720  },
  "480p":   { w: 854,  h: 480  },
  "360p":   { w: 640,  h: 360  },
};

export const getResolutionFilter = (res: string, mode: RenderMode = "balanced"): string | null => {
  const r = RESOLUTION_MAP[res];
  if (!r) return null;
  return buildScaleFilter(r.w, r.h, mode);
};
