import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export const writeInputFile = async (ff: FFmpeg, file: File, name: string) => {
  await ff.writeFile(name, await fetchFile(file));
};

export const readOutputBlob = async (ff: FFmpeg, name: string, mime: string): Promise<Blob> => {
  const data = await ff.readFile(name);
  await ff.deleteFile(name);
  const buffer = data instanceof Uint8Array ? data.buffer.slice(0) as ArrayBuffer : (data as unknown as ArrayBuffer);
  return new Blob([buffer], { type: mime });
};

export const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

/** Validate file before processing */
export const validateVideoFile = (file: File): string | null => {
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
  const ALLOWED = ["video/mp4","video/webm","video/quicktime","video/x-msvideo","video/x-matroska","video/avi","video/mov","video/mkv","video/ogg","video/3gpp","video/mpeg"];
  if (file.size > MAX_SIZE) return `File too large (${formatBytes(file.size)}). Max 2 GB.`;
  if (!file.type.startsWith("video/") && !ALLOWED.includes(file.type)) return "Please upload a valid video file.";
  return null;
};

/** Warn if file is large */
export const getFileSizeWarning = (file: File): string | null => {
  const MB = file.size / (1024 * 1024);
  if (MB > 500) return `Large file (${formatBytes(file.size)}) — processing may take a while on mobile.`;
  if (MB > 200) return `File is ${formatBytes(file.size)} — may take a few minutes.`;
  return null;
};

/** Check if video likely has audio (heuristic by extension/type) */
export const likelyHasAudio = (file: File): boolean => {
  const noAudioExts = [".gif"];
  const name = file.name.toLowerCase();
  return !noAudioExts.some(e => name.endsWith(e));
};
