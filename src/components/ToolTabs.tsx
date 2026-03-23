import { useState } from "react";
import { cn } from "@/lib/utils";
import ConvertTool from "./tools/ConvertTool";
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
  { id: "convert",   icon: "🔄", label: "Convert",  desc: "MP4, AVI, MOV, MKV, MP3, WAV" },
  { id: "clip",      icon: "✂️",  label: "Clip",     desc: "Short clips & loops" },
  { id: "filters",   icon: "🎨", label: "Filters",  desc: "Effects & adjustments" },
  { id: "text",      icon: "✍️",  label: "Text",     desc: "Captions & overlays" },
  { id: "merge",     icon: "🔗", label: "Merge",    desc: "Combine videos" },
  { id: "watermark", icon: "🖼",  label: "Watermark",desc: "Add logo" },
  { id: "subtitles", icon: "💬", label: "Subtitles",desc: "Burn SRT captions" },
  { id: "speed",     icon: "⚡", label: "Speed",    desc: "Slow / fast motion" },
  { id: "rotate",    icon: "↻",  label: "Rotate",   desc: "Rotate & flip" },
  { id: "frames",    icon: "📸", label: "Frames",   desc: "Extract snapshots" },
  { id: "gif",       icon: "🎞", label: "GIF",      desc: "Video to GIF" },
] as const;

type TabId = typeof TABS[number]["id"];

const TOOL_MAP: Record<TabId, React.ReactNode> = {
  convert:   <ConvertTool />,
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
    <div className="space-y-5 animate-fade-in">
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActive(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border",
                active === tab.id
                  ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200 dark:shadow-violet-900/40 scale-105"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700"
              )}>
              <span className="text-sm leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5 flex items-center gap-3">
          <span className="text-xl leading-none">{current.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{current.label}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{current.desc}</p>
          </div>
        </div>
        <div className="p-5 sm:p-6 animate-fade-in" key={active}>
          {TOOL_MAP[active]}
        </div>
      </div>
    </div>
  );
};

export default ToolTabs;
