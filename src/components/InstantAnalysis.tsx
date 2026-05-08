/**
 * InstantAnalysis — shown within 200ms of upload.
 * Gives users immediate intelligent feedback about their file.
 * Creates the "this app understands my file" feeling.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatBytes } from "@/lib/ffmpeg-run";
import { CheckCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisResult {
  icon: string;
  text: string;
  highlight?: string;
  type: "good" | "info" | "action";
}

interface InstantAnalysisProps {
  file: File;
  duration: number;
  width: number;
  height: number;
  onOpen: (toolId: string, preset?: string) => void;
}

const buildAnalysis = (file: File, duration: number, width: number, height: number): AnalysisResult[] => {
  const results: AnalysisResult[] = [];
  const mb = file.size / (1024 * 1024);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isPortrait = height > width;
  const compressionSavings = Math.round((1 - 0.35) * 100);

  // Format detection
  if (["avi", "mov", "mkv"].includes(ext)) {
    results.push({ icon: "🔄", text: `Detected ${ext.toUpperCase()} format`, highlight: "MP4 recommended", type: "action" });
  } else if (ext === "mp4") {
    results.push({ icon: "✓", text: "MP4 format detected", highlight: "Best compatibility", type: "good" });
  }

  // Resolution
  if (width > 0 && height > 0) {
    if (width >= 3840) {
      results.push({ icon: "🎬", text: `4K resolution (${width}×${height})`, highlight: "Can resize to 1080p", type: "action" });
    } else if (width >= 1920) {
      results.push({ icon: "✓", text: `Full HD ${width}×${height}`, highlight: "Great quality", type: "good" });
    } else {
      results.push({ icon: "📐", text: `${width}×${height} resolution`, type: "info" });
    }
  }

  // Aspect ratio
  if (isPortrait) {
    results.push({ icon: "📱", text: "Vertical video detected", highlight: "TikTok/Reels ready", type: "good" });
  } else if (width > 0 && Math.abs(width / height - 16 / 9) < 0.05) {
    results.push({ icon: "▶️", text: "16:9 widescreen", highlight: "YouTube ready", type: "good" });
  }

  // File size
  if (mb > 100) {
    results.push({ icon: "📦", text: `${formatBytes(file.size)} file size`, highlight: `~${compressionSavings}% compression available`, type: "action" });
  } else if (mb > 20) {
    results.push({ icon: "📦", text: `${formatBytes(file.size)} file size`, highlight: "Can compress for sharing", type: "info" });
  } else {
    results.push({ icon: "✓", text: `${formatBytes(file.size)} — compact file`, type: "good" });
  }

  // Duration
  if (duration > 0) {
    if (duration > 600) {
      results.push({ icon: "✂️", text: `${Math.round(duration / 60)}m video`, highlight: "Consider trimming", type: "action" });
    } else if (duration > 60) {
      const m = Math.floor(duration / 60);
      const s = Math.round(duration % 60);
      results.push({ icon: "⏱", text: `${m}m ${s}s duration`, type: "info" });
    } else {
      results.push({ icon: "⚡", text: `${Math.round(duration)}s clip`, highlight: "Perfect for social", type: "good" });
    }
  }

  // AI captions availability
  results.push({ icon: "✨", text: "AI captions available", highlight: "TikTok/Reel styles", type: "action" });

  return results.slice(0, 5);
};

const InstantAnalysis = ({ file, duration, width, height, onOpen }: InstantAnalysisProps) => {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    // Show within 200ms
    const t1 = setTimeout(() => setVisible(true), 80);
    const t2 = setTimeout(() => {
      setItems(buildAnalysis(file, duration, width, height));
    }, 150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [file, duration, width, height]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="glass-card p-4 space-y-3 border-violet-200/60 dark:border-violet-800/40"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            Instant Analysis
          </p>
          <span className="ml-auto text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Ready
          </span>
        </div>

        {/* Analysis items */}
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <span className={cn(
                "text-sm shrink-0 w-5 text-center",
                item.icon === "✓" ? "text-green-500" : ""
              )}>
                {item.icon === "✓" ? <CheckCircle className="w-4 h-4 text-green-500" /> : item.icon}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{item.text}</span>
              {item.highlight && (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap",
                  item.type === "good"   && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                  item.type === "action" && "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
                  item.type === "info"   && "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
                )}>
                  {item.highlight}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick action row */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          <button onClick={() => onOpen("autooptimize")}
            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
            <Zap className="w-3 h-3" /> Auto Optimize
          </button>
          <button onClick={() => onOpen("aicaption")}
            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700 transition-colors">
            ✨ Add Captions
          </button>
          <button onClick={() => onOpen("compress")}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 transition-colors">
            📦 Compress
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstantAnalysis;
