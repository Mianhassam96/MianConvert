/** Smart presets for Convert and Compress tools */

export interface ConvertPreset {
  id: string;
  label: string;
  icon: string;
  fmt: string;
  res: string;
  quality: string;
  description: string;
}

export const CONVERT_PRESETS: ConvertPreset[] = [
  { id: "youtube",   icon: "▶️",  label: "YouTube 1080p",    fmt: "mp4",  res: "1080p",    quality: "high",   description: "H.264, 1080p, high quality" },
  { id: "instagram", icon: "📸",  label: "Instagram Reel",   fmt: "mp4",  res: "720p",     quality: "medium", description: "MP4, 720p, square-friendly" },
  { id: "tiktok",    icon: "🎵",  label: "TikTok",           fmt: "mp4",  res: "720p",     quality: "medium", description: "MP4, 720p, vertical" },
  { id: "whatsapp",  icon: "💬",  label: "WhatsApp",         fmt: "mp4",  res: "480p",     quality: "low",    description: "Small MP4, 480p" },
  { id: "twitter",   icon: "🐦",  label: "Twitter/X",        fmt: "mp4",  res: "720p",     quality: "medium", description: "MP4, 720p" },
  { id: "web",       icon: "🌐",  label: "Web (WebM)",       fmt: "webm", res: "720p",     quality: "medium", description: "WebM VP9, great for web" },
  { id: "audio_mp3", icon: "🎵",  label: "Audio MP3",        fmt: "mp3",  res: "original", quality: "high",   description: "Extract audio as MP3" },
  { id: "original",  icon: "📁",  label: "Custom",           fmt: "mp4",  res: "original", quality: "medium", description: "Set your own settings" },
];

export interface CompressPreset {
  id: string;
  label: string;
  icon: string;
  crf: string;
  res: string;
  description: string;
}

export const COMPRESS_PRESETS: CompressPreset[] = [
  { id: "smallest",  icon: "📦", label: "Smallest",  crf: "38", res: "480p",     description: "Max compression, smaller file" },
  { id: "balanced",  icon: "⚖️", label: "Balanced",  crf: "28", res: "720p",     description: "Good quality, reasonable size" },
  { id: "quality",   icon: "✨", label: "High Quality", crf: "18", res: "original", description: "Near lossless, larger file" },
  { id: "mobile",    icon: "📱", label: "Mobile",    crf: "33", res: "360p",     description: "Optimized for mobile sharing" },
];
