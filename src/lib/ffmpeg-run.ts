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
