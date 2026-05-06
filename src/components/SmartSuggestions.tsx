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
}> = {
  compress: {
    icon: "📦",
    label: "Compress",
    reason: (f) => `File is ${formatBytes(f.size)} — reduce size without quality loss`,
  },
  convert: {
    icon: "🔄",
    label: "Convert",
    reason: (f) => {
      const ext = f.name.split(".").pop()?.toUpperCase() ?? "this format";
      return `${ext} detected — convert to MP4 for best compatibility`;
    },
  },
  timeline: {
    icon: "✂️",
    label: "Trim / Cut",
    reason: (_f, d) => `Video is ${Math.round(d)}s long — trim to the best part`,
  },
  resize: {
    icon: "📐",
    label: "Resize",
    reason: (_f, _d, w, h) => `${w}×${h} — scale down for web or mobile`,
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
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                  {meta.label}
                </p>
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
