import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { tabPanel } from "@/lib/motion";
import ConvertTool from "./tools/ConvertTool";
import CompressTool from "./tools/CompressTool";
import MuteTool from "./tools/MuteTool";
import MergeTool from "./tools/MergeTool";
import WatermarkTool from "./tools/WatermarkTool";
import SubtitleTool from "./tools/SubtitleTool";
import SpeedTool from "./tools/SpeedTool";
import RotateTool from "./tools/RotateTool";
import FramesTool from "./tools/FramesTool";
import GifTool from "./tools/GifTool";
import ClipTool from "./tools/ClipTool";
import FiltersTool from "./tools/FiltersTool";
import TextOverlayTool from "./tools/TextOverlayTool";

const TABS = [
  { id: "convert",  icon: "🔄", label: "Convert",  desc: "MP4, AVI, MOV, MKV, MP3, WAV" },
  { id: "compress", icon: "📦", label: "Compress",  desc: "Reduce file size" },
  { id: "mute",     icon: "🔇", label: "Mute",      desc: "Remove or extract audio" },
  { id: "clip",     icon: "✂️",  label: "Clip",      desc: "Short clips & loops" },
  { id: "filters",  icon: "🎨", label: "Filters",   desc: "Effects & live preview" },
  { id: "text",     icon: "✍️",  label: "Text",      desc: "Captions & overlays" },
  { id: "merge",    icon: "🔗", label: "Merge",     desc: "Combine videos" },
  { id: "watermark",icon: "🖼",  label: "Watermark", desc: "Add logo" },
  { id: "subtitles",icon: "💬", label: "Subtitles", desc: "Burn SRT captions" },
  { id: "speed",    icon: "⚡", label: "Speed",     desc: "Slow / fast motion" },
  { id: "rotate",   icon: "↻",  label: "Rotate",    desc: "Rotate & flip" },
  { id: "frames",   icon: "📸", label: "Frames",    desc: "Extract snapshots" },
  { id: "gif",      icon: "🎞", label: "GIF",       desc: "Video to GIF" },
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
  subtitles: <SubtitleTool />,
  speed:     <SpeedTool />,
  rotate:    <RotateTool />,
  frames:    <FramesTool />,
  gif:       <GifTool />,
};

const ToolTabs = () => {
  const [active, setActive] = useState<TabId>("convert");
  const current = TABS.find(t => t.id === active)!;

  return (
    <div className="space-y-4">
      {/* Scrollable tab bar */}
      <div className="overflow-x-auto -mx-1 px-1 pb-2 scrollbar-hide">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map(tab => (
            <motion.button key={tab.id} onClick={() => setActive(tab.id)}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap border",
                active === tab.id
                  ? "text-white border-transparent"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700 dark:hover:text-violet-400"
              )}>
              {active === tab.id && (
                <motion.span layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7,#d946ef)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 text-sm leading-none">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tool panel */}
      <div className="glass-card overflow-hidden">
        {/* Panel header */}
        <div className="bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/60 dark:to-gray-900/60 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 sm:px-5 py-3.5 flex items-center gap-3">
          <motion.span key={current.icon} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-xl leading-none">{current.icon}</motion.span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{current.label}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{current.desc}</p>
          </div>
        </div>

        {/* Animated panel content */}
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
