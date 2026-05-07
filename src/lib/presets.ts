/** Smart presets for Convert and Compress tools */

export interface ConvertPreset {
  id: string;
  label: string;
  icon: string;
  fmt: string;
  res: string;
  quality: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

export const CONVERT_PRESETS: ConvertPreset[] = [
  { id: "youtube",   icon: "▶️",  label: "YouTube 1080p",  fmt: "mp4",  res: "1080p",    quality: "high",   description: "H.264, 1080p, high quality",    badge: "⭐ Best Quality",   badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { id: "instagram", icon: "📸",  label: "Instagram Reel", fmt: "mp4",  res: "720p",     quality: "medium", description: "MP4, 720p, square-friendly",     badge: "🔥 Most Popular",  badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  { id: "tiktok",    icon: "🎵",  label: "TikTok",         fmt: "mp4",  res: "720p",     quality: "medium", description: "MP4, 720p, vertical",            badge: "🔥 Most Popular",  badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  { id: "whatsapp",  icon: "💬",  label: "WhatsApp",       fmt: "mp4",  res: "480p",     quality: "low",    description: "Small MP4, 480p",                badge: "📱 Mobile Friendly",badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { id: "twitter",   icon: "🐦",  label: "Twitter/X",      fmt: "mp4",  res: "720p",     quality: "medium", description: "MP4, 720p",                      badge: "⚡ Fastest",        badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "web",       icon: "🌐",  label: "Web (WebM)",     fmt: "webm", res: "720p",     quality: "medium", description: "WebM VP9, great for web",        badge: "🌐 Web Optimized",  badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { id: "audio_mp3", icon: "🎵",  label: "Audio MP3",      fmt: "mp3",  res: "original", quality: "high",   description: "Extract audio as MP3",           badge: "🎧 Audio Only",     badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  { id: "original",  icon: "📁",  label: "Custom",         fmt: "mp4",  res: "original", quality: "medium", description: "Set your own settings" },
];

export interface CompressPreset {
  id: string;
  label: string;
  icon: string;
  crf: string;
  res: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  /** Estimated size reduction % */
  savingsEst?: number;
}

export const COMPRESS_PRESETS: CompressPreset[] = [
  { id: "smallest", icon: "📦", label: "Smallest",     crf: "38", res: "480p",     description: "Max compression, smaller file",  badge: "📦 Max Savings",    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", savingsEst: 80 },
  { id: "balanced", icon: "⚖️", label: "Balanced",     crf: "28", res: "720p",     description: "Good quality, reasonable size",  badge: "🔥 Most Popular",   badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",         savingsEst: 60 },
  { id: "quality",  icon: "✨", label: "High Quality", crf: "18", res: "original", description: "Near lossless, larger file",      badge: "⭐ Best Quality",   badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    savingsEst: 20 },
  { id: "mobile",   icon: "📱", label: "Mobile",       crf: "33", res: "360p",     description: "Optimized for mobile sharing",   badge: "📱 Mobile Friendly",badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",    savingsEst: 70 },
];
