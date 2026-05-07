/**
 * Caption Engine
 *
 * Uses the Web Speech API (SpeechRecognition) for browser-native
 * speech-to-text — zero download, instant, works in Chrome/Edge/Safari.
 *
 * Falls back gracefully when not supported.
 */

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface CaptionStyle {
  id: string;
  label: string;
  platform: string;
  emoji: string;
  fontSize: number;
  color: string;
  bgColor: string;
  bgOpacity: number;
  position: "bottom" | "top" | "middle";
  bold: boolean;
  uppercase: boolean;
  /** FFmpeg drawtext extra params */
  ffmpegExtra?: string;
}

// ── Caption Style Presets ─────────────────────────────────────────────────────
export const CAPTION_STYLES: CaptionStyle[] = [
  {
    id: "tiktok-bold",
    label: "TikTok Bold",
    platform: "TikTok",
    emoji: "📱",
    fontSize: 42,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.6,
    position: "bottom",
    bold: true,
    uppercase: true,
  },
  {
    id: "reel-glow",
    label: "Reel Glow",
    platform: "Instagram",
    emoji: "📸",
    fontSize: 36,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.4,
    position: "bottom",
    bold: true,
    uppercase: false,
  },
  {
    id: "youtube-clean",
    label: "YouTube Clean",
    platform: "YouTube",
    emoji: "▶️",
    fontSize: 28,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.5,
    position: "bottom",
    bold: false,
    uppercase: false,
  },
  {
    id: "podcast-minimal",
    label: "Podcast Minimal",
    platform: "Podcast",
    emoji: "🎙",
    fontSize: 24,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.3,
    position: "bottom",
    bold: false,
    uppercase: false,
  },
  {
    id: "gaming-neon",
    label: "Gaming Neon",
    platform: "Gaming",
    emoji: "🎮",
    fontSize: 38,
    color: "#00ffff",
    bgColor: "#000000",
    bgOpacity: 0.7,
    position: "bottom",
    bold: true,
    uppercase: true,
  },
  {
    id: "news-lower",
    label: "News Lower Third",
    platform: "News",
    emoji: "📰",
    fontSize: 26,
    color: "#ffffff",
    bgColor: "#0066cc",
    bgOpacity: 0.85,
    position: "bottom",
    bold: false,
    uppercase: false,
  },
];

// ── SRT Generator ─────────────────────────────────────────────────────────────

const pad = (n: number, len = 2) => String(Math.floor(n)).padStart(len, "0");

const toSRTTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
};

export const segmentsToSRT = (segments: CaptionSegment[]): string => {
  return segments
    .map((seg, i) => `${i + 1}\n${toSRTTime(seg.start)} --> ${toSRTTime(seg.end)}\n${seg.text}`)
    .join("\n\n");
};

// ── Web Speech API ────────────────────────────────────────────────────────────

export const isSpeechSupported = (): boolean => {
  return typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
};

export interface TranscribeOptions {
  language?: string;
  onSegment?: (seg: CaptionSegment) => void;
  onProgress?: (text: string) => void;
}

/**
 * Transcribe audio from a video/audio file using Web Speech API.
 * Plays the media element and captures speech recognition results.
 *
 * Returns array of CaptionSegments.
 */
export const transcribeWithSpeechAPI = (
  mediaEl: HTMLVideoElement | HTMLAudioElement,
  opts: TranscribeOptions = {}
): Promise<CaptionSegment[]> => {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error("Speech recognition not supported in this browser. Use Chrome or Edge."));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = opts.language ?? "en-US";
    recognition.maxAlternatives = 1;

    const segments: CaptionSegment[] = [];
    let lastFinalTime = 0;

    recognition.onresult = (event: any) => {
      const currentTime = mediaEl.currentTime;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (result.isFinal && transcript) {
          const seg: CaptionSegment = {
            start: lastFinalTime,
            end: currentTime,
            text: transcript,
          };
          segments.push(seg);
          lastFinalTime = currentTime;
          opts.onSegment?.(seg);
        } else if (!result.isFinal) {
          opts.onProgress?.(transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return; // ignore silence
      if (event.error === "aborted") return;
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      // If media is still playing, restart recognition
      if (!mediaEl.paused && !mediaEl.ended) {
        try { recognition.start(); } catch {}
      } else {
        resolve(segments);
      }
    };

    mediaEl.onended = () => {
      recognition.stop();
      resolve(segments);
    };

    // Start recognition and play media
    try {
      recognition.start();
      mediaEl.currentTime = 0;
      mediaEl.play().catch(() => {
        recognition.stop();
        reject(new Error("Could not play media for transcription."));
      });
    } catch (e) {
      reject(e);
    }
  });
};

// ── FFmpeg drawtext builder for caption styles ────────────────────────────────

export const buildCaptionFilter = (
  segments: CaptionSegment[],
  style: CaptionStyle
): string[] => {
  const colorHex = style.color.replace("#", "");
  const bgHex = style.bgColor.replace("#", "");
  const y = style.position === "bottom" ? "h-th-40"
    : style.position === "top" ? "40"
    : "(h-th)/2";

  return segments.map(seg => {
    let text = seg.text;
    if (style.uppercase) text = text.toUpperCase();
    const escaped = text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
    const boxOpacity = style.bgOpacity.toFixed(2);
    return `drawtext=text='${escaped}':fontsize=${style.fontSize}:fontcolor=0x${colorHex}:x=(w-tw)/2:y=${y}:enable='between(t,${seg.start.toFixed(3)},${seg.end.toFixed(3)})':box=1:boxcolor=0x${bgHex}@${boxOpacity}:boxborderw=8${style.bold ? ":font=bold" : ""}`;
  });
};
