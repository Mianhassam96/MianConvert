import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { tabPanel } from "@/lib/motion";
import ConvertTool from "./tools/ConvertTool";
import CompressTool from "./tools/CompressTool";
import MuteTool from "./tools/MuteTool";
import MergeTool from "./tools/MergeTool";
import WatermarkTool from "./tools/WatermarkTool";
import SpeedTool from "./tools/SpeedTool";
import RotateTool from "./tools/RotateTool";
import FramesTool from "./tools/FramesTool";
import GifTool from "./tools/GifTool";
import ClipTool from "./tools/ClipTool";
import FiltersTool from "./tools/FiltersTool";
import TextOverlayTool from "./tools/TextOverlayTool";
import ReverseTool from "./tools/ReverseTool";
import CropTool from "./tools/CropTool";
import AudioTool from "./tools/AudioTool";

const TABS = [
  { id: "convert",   icon: "🔄", label: "Convert",   desc: "MP4, AVI, MOV, MKV, MP3, WAV" },
  { id: "compress",  icon: "📦", label: "Compress",   desc: "Reduce file size" },
  { id: "mute",      icon: "🔇", label: "Mute",       desc: "Remove or extract audio" },
  { id: "clip",      icon: "✂️",  label: "Clip",       desc: "Short clips & loops" },
  { id: "filters",   icon: "🎨", label: "Filters",    desc: "Effects & live preview" },
  { id: "text",      icon: "✍️",  label: "Text",       desc: "Captions & overlays" },
  { id: "merge",     icon: "🔗", label: "Merge",      desc: "Combine videos" },
  { id: "watermark", icon: "🖼",  label: "Watermark",  desc: "Add logo" },
  { id: "speed",     icon: "⚡", label: "Speed",      desc: "Slow / fast motion" },
  { id: "rotate",    icon: "↻",  label: "Rotate",     desc: "Rotate & flip" },
  { id: "crop",      icon: "⬛", label: "Crop",       desc: "Crop to any ratio" },
  { id: "reverse",   icon: "⏪", label: "Reverse",    desc: "Reverse video & audio" },
  { id: "audio",     icon: "🎵", label: "Audio",      desc: "Volume, fade in/out" },
  { id: "frames",    icon: "📸", label: "Frames",     desc: "Extract snapshots" },
  { id: "gif",       icon: "🎞", label: "GIF",        desc: "Video to GIF" },
] as const;

type TabId = typeof TABS[number]["id"];

const TOOL_MAP: Record<TabId, React.ReactNode> = {
  convert:   <ConvertTool />,
  compress:  <CompressTool />,
  mute:      <MuteTool />,
  clip:      <ClipTool />,
  filters:   <FiltersTool />,
  text:      <TextOverlayTool />,
  merge:     <MergeTool />,
  watermark: <WatermarkTool />,
  speed:     <SpeedTool />,
  rotate:    <RotateTool />,
  crop:      <CropTool />,
  reverse:   <ReverseTool />,
  audio:     <AudioTool />,
  frames:    <FramesTool />,
  gif:       <GifTool />,
};

const ToolTabs = () => {
  const [active, setActive] = useState<TabId>("convert");
  const current = TABS.find(t => t.id === active)!;

  return (
    <div className="space-y-3">

      {/* ── Tab bar: scrollable on mobile, wraps on larger screens ── */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        <div className="flex gap-1.5 min-w-max sm:min-w-0 sm:flex-wrap">
          {TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl",
                "text-[11px] sm:text-xs font-semibold whitespace-nowrap border transition-colors",
                active === tab.id
                  ? "text-white border-transparent shadow-lg shadow-violet-500/25"
                  : [
                    "bg-white dark:bg-gray-900/80",
                    "border-gray-200 dark:border-gray-700/80",
                    "text-gray-600 dark:text-gray-300",
                    "hover:border-violet-300 dark:hover:border-violet-700",
                    "hover:text-violet-600 dark:hover:text-violet-400",
                    "hover:bg-violet-50/50 dark:hover:bg-violet-950/20",
                  ].join(" ")
              )}>
              {/* Active gradient bg */}
              {active === tab.id && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7,#d946ef)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 text-sm sm:text-base leading-none">{tab.icon}</span>
              <span className="relative z-10 leading-none">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Tool panel ── */}
      <div className="glass-card overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 dark:border-gray-800/80 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm">
          <motion.span
            key={current.icon}
            initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="text-xl sm:text-2xl leading-none shrink-0">
            {current.icon}
          </motion.span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">{current.label}</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{current.desc}</p>
          </div>
          {/* Active indicator dot */}
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50 shrink-0"
          />
        </div>

        {/* Animated content */}
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} variants={tabPanel} initial="hidden" animate="show" exit="exit">
              {TOOL_MAP[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ToolTabs;
