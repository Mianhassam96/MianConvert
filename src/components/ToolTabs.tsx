import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { tabPanel } from "@/lib/motion";

// New 12 tools
import ProEditorTool from "./tools/ProEditorTool";
import TimelineTool from "./tools/TimelineTool";
import OverlayStudioTool from "./tools/OverlayStudioTool";
import CleanVideoTool from "./tools/CleanVideoTool";
import ConvertTool from "./tools/ConvertTool";
import CompressTool from "./tools/CompressTool";
import ResizeTool from "./tools/ResizeTool";
import GifTool from "./tools/GifTool";
import AudioStudioTool from "./tools/AudioStudioTool";
import MergeTool from "./tools/MergeTool";
import SubtitleTool from "./tools/SubtitleTool";
import ThumbnailTool from "./tools/ThumbnailTool";

interface TabDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  group: string;
}

const GROUPS = [
  { id: "edit",     label: "✏️ Edit",     color: "from-violet-600 to-purple-600" },
  { id: "convert",  label: "🔄 Convert",  color: "from-blue-600 to-cyan-600" },
  { id: "audio",    label: "🎵 Audio",    color: "from-fuchsia-600 to-pink-600" },
  { id: "advanced", label: "⚡ Advanced", color: "from-orange-500 to-amber-500" },
];

const TABS: TabDef[] = [
  // Edit
  { id: "proeditor",  icon: "🎬", label: "Pro Editor",    desc: "Filters, color grading, crop",    group: "edit" },
  { id: "timeline",   icon: "✂️",  label: "Timeline",      desc: "Trim, cut, speed, loop",          group: "edit" },
  { id: "overlay",    icon: "🧩", label: "Overlay Studio", desc: "Text, logos, watermarks",         group: "edit" },
  { id: "clean",      icon: "🧹", label: "Clean Video",    desc: "Remove logo or text",             group: "edit" },
  // Convert
  { id: "convert",    icon: "🔄", label: "Convert",        desc: "MP4, WebM, AVI, MOV, MP3",       group: "convert" },
  { id: "compress",   icon: "📦", label: "Compress",       desc: "Reduce file size",                group: "convert" },
  { id: "resize",     icon: "📐", label: "Resize",         desc: "Resolution & aspect ratio",       group: "convert" },
  { id: "gif",        icon: "🎞", label: "GIF Maker",      desc: "Video to animated GIF",           group: "convert" },
  // Audio
  { id: "audiostudio",icon: "🎵", label: "Audio Studio",   desc: "Volume, fade, extract, convert",  group: "audio" },
  // Advanced
  { id: "merge",      icon: "🔗", label: "Merge",          desc: "Combine multiple videos",         group: "advanced" },
  { id: "subtitle",   icon: "💬", label: "Subtitle",       desc: "Burn SRT captions",               group: "advanced" },
  { id: "thumbnail",  icon: "🖼", label: "Thumbnail",      desc: "Generate video thumbnail",        group: "advanced" },
];

type TabId = typeof TABS[number]["id"];

const TOOL_MAP: Record<string, React.ReactNode> = {
  proeditor:   <ProEditorTool />,
  timeline:    <TimelineTool />,
  overlay:     <OverlayStudioTool />,
  clean:       <CleanVideoTool />,
  convert:     <ConvertTool />,
  compress:    <CompressTool />,
  resize:      <ResizeTool />,
  gif:         <GifTool />,
  audiostudio: <AudioStudioTool />,
  merge:       <MergeTool />,
  subtitle:    <SubtitleTool />,
  thumbnail:   <ThumbnailTool />,
};

const ToolTabs = () => {
  const [active, setActive] = useState<string>("proeditor");
  const [activeGroup, setActiveGroup] = useState("edit");
  const current = TABS.find(t => t.id === active)!;
  const groupTabs = TABS.filter(t => t.group === activeGroup);

  const handleGroupChange = (groupId: string) => {
    setActiveGroup(groupId);
    const first = TABS.find(t => t.group === groupId);
    if (first) setActive(first.id);
  };

  return (
    <div className="space-y-3">

      {/* ── Group selector ── */}
      <div className="grid grid-cols-4 gap-1.5">
        {GROUPS.map(g => (
          <motion.button
            key={g.id}
            onClick={() => handleGroupChange(g.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative py-2 px-2 rounded-xl text-xs font-bold transition-all border overflow-hidden",
              activeGroup === g.id
                ? "text-white border-transparent shadow-lg"
                : "bg-white dark:bg-gray-900/80 border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700"
            )}>
            {activeGroup === g.id && (
              <motion.span
                layoutId="group-bg"
                className={cn("absolute inset-0 bg-gradient-to-r", g.color)}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10 block text-center leading-tight">{g.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ── Tool tab bar ── */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        <div className="flex gap-1.5 min-w-max sm:min-w-0 sm:flex-wrap">
          {groupTabs.map(tab => (
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
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {GROUPS.find(g => g.id === current.group)?.label}
            </span>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50"
            />
          </div>
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
