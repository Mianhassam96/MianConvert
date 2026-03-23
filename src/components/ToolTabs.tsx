import { useState } from "react";
import { cn } from "@/lib/utils";
import ConvertTool from "./tools/ConvertTool";
import MergeTool from "./tools/MergeTool";
import WatermarkTool from "./tools/WatermarkTool";
import SubtitleTool from "./tools/SubtitleTool";
import SpeedTool from "./tools/SpeedTool";
import FramesTool from "./tools/FramesTool";
import GifTool from "./tools/GifTool";

const TABS = [
  { id: "convert",   icon: "🔄", label: "Convert",   desc: "Format, compress, trim" },
  { id: "merge",     icon: "🔗", label: "Merge",      desc: "Combine videos" },
  { id: "watermark", icon: "🖼",  label: "Watermark",  desc: "Add logo / overlay" },
  { id: "subtitles", icon: "💬", label: "Subtitles",  desc: "Burn SRT captions" },
  { id: "speed",     icon: "⚡", label: "Speed",      desc: "Slow / fast motion" },
  { id: "frames",    icon: "📸", label: "Frames",     desc: "Extract snapshots" },
  { id: "gif",       icon: "🎞", label: "GIF",        desc: "Video to GIF" },
] as const;

type TabId = typeof TABS[number]["id"];

const TOOL_MAP: Record<TabId, React.ReactNode> = {
  convert:   <ConvertTool />,
  merge:     <MergeTool />,
  watermark: <WatermarkTool />,
  subtitles: <SubtitleTool />,
  speed:     <SpeedTool />,
  frames:    <FramesTool />,
  gif:       <GifTool />,
};

const ToolTabs = () => {
  const [active, setActive] = useState<TabId>("convert");
  const current = TABS.find(t => t.id === active)!;

  return (
    <div className="space-y-6">
      {/* Tab bar — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2 min-w-max pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                active === tab.id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-violet-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-600"
              )}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active tool panel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{current.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{current.label}</h3>
              <p className="text-xs text-gray-500">{current.desc}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {TOOL_MAP[active]}
        </div>
      </div>
    </div>
  );
};

export default ToolTabs;
