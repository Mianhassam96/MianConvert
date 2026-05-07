import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UseCase {
  icon: string;
  label: string;
  subtext: string;
  toolId: string;
  preset?: string;
  border: string;
  bg: string;
}

const USE_CASES: UseCase[] = [
  { icon: "📱", label: "Make TikTok video",   subtext: "Recommended for vertical clips",  toolId: "convert",     preset: "tiktok",    border: "hover:border-pink-400 dark:hover:border-pink-600",     bg: "hover:bg-pink-50 dark:hover:bg-pink-950/20" },
  { icon: "📦", label: "Reduce file size",    subtext: "Smart compression for your file", toolId: "compress",    preset: undefined,   border: "hover:border-cyan-400 dark:hover:border-cyan-600",     bg: "hover:bg-cyan-50 dark:hover:bg-cyan-950/20" },
  { icon: "✂️", label: "Cut / trim video",    subtext: "Based on your video length",      toolId: "timeline",    preset: undefined,   border: "hover:border-purple-400 dark:hover:border-purple-600", bg: "hover:bg-purple-50 dark:hover:bg-purple-950/20" },
  { icon: "🎧", label: "Extract audio",       subtext: "Optimized for your format",       toolId: "audiostudio", preset: undefined,   border: "hover:border-fuchsia-400 dark:hover:border-fuchsia-600",bg: "hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/20" },
  { icon: "🎬", label: "Improve quality",     subtext: "Recommended based on your video", toolId: "proeditor",   preset: undefined,   border: "hover:border-violet-400 dark:hover:border-violet-600", bg: "hover:bg-violet-50 dark:hover:bg-violet-950/20" },
  { icon: "📸", label: "Create thumbnail",    subtext: "Best frame extraction",           toolId: "thumbnail",   preset: undefined,   border: "hover:border-amber-400 dark:hover:border-amber-600",   bg: "hover:bg-amber-50 dark:hover:bg-amber-950/20" },
  { icon: "▶️", label: "YouTube 1080p",       subtext: "Optimized for YouTube upload",    toolId: "convert",     preset: "youtube",   border: "hover:border-red-400 dark:hover:border-red-600",       bg: "hover:bg-red-50 dark:hover:bg-red-950/20" },
  { icon: "💬", label: "Add subtitles",       subtext: "Burn captions into video",        toolId: "subtitle",    preset: undefined,   border: "hover:border-blue-400 dark:hover:border-blue-600",     bg: "hover:bg-blue-50 dark:hover:bg-blue-950/20" },
];

interface UseCaseBarProps {
  onOpen: (toolId: string, preset?: string) => void;
}

const UseCaseBar = ({ onOpen }: UseCaseBarProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.1 }}
    className="space-y-3"
  >
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
      What do you want to do?
    </p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {USE_CASES.map((uc, i) => (
        <motion.button
          key={`${uc.toolId}-${uc.preset ?? i}`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 + i * 0.04 }}
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onOpen(uc.toolId, uc.preset)}
          className={cn(
            "flex flex-col items-start gap-1 px-3 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700",
            "bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm",
            "text-left transition-all duration-200 group shadow-sm",
            uc.border, uc.bg
          )}
        >
          <span className="text-xl transition-transform duration-200 group-hover:scale-110">
            {uc.icon}
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">
            {uc.label}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
            {uc.subtext}
          </span>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default UseCaseBar;
