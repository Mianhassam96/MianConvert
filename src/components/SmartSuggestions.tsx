import { motion } from "framer-motion";
import { formatBytes } from "@/lib/ffmpeg-run";

interface SmartSuggestionsProps {
  file: File;
  duration: number;
  width: number;
  height: number;
  suggestions: string[];
  onOpen: (toolId: string) => void;
}

const TOOL_META: Record<string, {
  icon: string;
  label: string;
  reason: (f: File, d: number, w: number, h: number) => string;
  badge?: (f: File, d: number, w: number, h: number) => string;
}> = {
  compress: {
    icon: "📦",
    label: "Compress",
    reason: (f) => {
      const mb = f.size / (1024 * 1024);
      const est = Math.round(mb * 0.35);
      return `Reduce ${formatBytes(f.size)} → ~${est}MB for WhatsApp & sharing`;
    },
    badge: (f) => {
      const pct = Math.round((1 - 0.35) * 100);
      return `~${pct}% smaller`;
    },
  },
  convert: {
    icon: "🔄",
    label: "Convert to MP4",
    reason: (f) => {
      const ext = f.name.split(".").pop()?.toUpperCase() ?? "this format";
      return `${ext} → MP4 for best compatibility on all devices`;
    },
    badge: () => "Best compatibility",
  },
  timeline: {
    icon: "✂️",
    label: "Trim / Cut",
    reason: (_f, d) => {
      const mins = Math.floor(d / 60);
      const secs = Math.round(d % 60);
      return `${mins}m ${secs}s video — trim to the best part`;
    },
    badge: () => "Save space",
  },
  resize: {
    icon: "📐",
    label: "Resize",
    reason: (_f, _d, w, h) => `${w}×${h} → scale to 1080p or 720p for web & mobile`,
    badge: (_f, _d, w) => w > 3000 ? "4K → 1080p" : "Downscale",
  },
};

const SmartSuggestions = ({ file, duration, width, height, suggestions, onOpen }: SmartSuggestionsProps) => {
  if (!suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>✨</span> Suggested for your file
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {suggestions.map((id, i) => {
          const meta = TOOL_META[id];
          if (!meta) return null;
          const badge = meta.badge?.(file, duration, width, height);
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpen(id)}
              className="flex items-start gap-3 p-3 rounded-xl border-2 border-violet-200 dark:border-violet-800/60 bg-violet-50/60 dark:bg-violet-950/20 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-all text-left group"
            >
              <span className="text-xl shrink-0 mt-0.5">{meta.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                    {meta.label}
                  </p>
                  {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shrink-0">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                  {meta.reason(file, duration, width, height)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SmartSuggestions;
