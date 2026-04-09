import { useRef, useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// ── Singleton: one FFmpeg instance shared across all tools ──────────────────
let globalFFmpeg: FFmpeg | null = null;
let globalLoaded = false;
let globalLoading = false;
let loadPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();
const notifyAll = () => listeners.forEach(fn => fn());

export const useFFmpeg = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(globalLoaded);
  const [loading, setLoading] = useState(globalLoading);
  const [loadProgress, setLoadProgress] = useState(0);

  // Subscribe to global state changes
  const subscribe = useCallback(() => {
    setLoaded(globalLoaded);
    setLoading(globalLoading);
    if (globalFFmpeg) ffmpegRef.current = globalFFmpeg;
  }, []);

  useState(() => {
    listeners.add(subscribe);
    if (globalLoaded && globalFFmpeg) ffmpegRef.current = globalFFmpeg;
    return () => { listeners.delete(subscribe); };
  });

  const load = useCallback(async () => {
    // Already loaded — just sync ref
    if (globalLoaded && globalFFmpeg) {
      ffmpegRef.current = globalFFmpeg;
      setLoaded(true);
      return;
    }
    // Already loading — wait for it
    if (loadPromise) return loadPromise;

    globalLoading = true;
    notifyAll();
    setLoading(true);
    setLoadProgress(5);

    loadPromise = (async () => {
      try {
        const ffmpeg = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

        setLoadProgress(20);
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        ]);
        setLoadProgress(70);

        await ffmpeg.load({ coreURL, wasmURL });
        setLoadProgress(100);

        globalFFmpeg = ffmpeg;
        globalLoaded = true;
        globalLoading = false;
        ffmpegRef.current = ffmpeg;
        setLoaded(true);
        setLoading(false);
        notifyAll();
      } catch (e) {
        globalLoading = false;
        loadPromise = null;
        setLoading(false);
        throw e;
      }
    })();

    return loadPromise;
  }, []);

  return { ffmpeg: ffmpegRef, loaded, loading, loadProgress, load };
};
