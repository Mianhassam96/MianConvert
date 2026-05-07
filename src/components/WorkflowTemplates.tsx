import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface WorkflowStep {
  icon: string;
  label: string;
  toolId: string;
  preset?: string;
}

interface WorkflowTemplate {
  id: string;
  icon: string;
  title: string;
  desc: string;
  gradient: string;
  badge: string;
  steps: WorkflowStep[];
  firstTool: string;
  firstPreset?: string;
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tiktok",
    icon: "📱",
    title: "TikTok Creator Pack",
    desc: "Convert 9:16 → Compress → Add subtitles",
    gradient: "from-pink-500 to-rose-500",
    badge: "🔥 Most Popular",
    firstTool: "convert",
    firstPreset: "tiktok",
    steps: [
      { icon: "🔄", label: "Convert 9:16", toolId: "convert", preset: "tiktok" },
      { icon: "📦", label: "Compress",     toolId: "compress" },
      { icon: "💬", label: "Add subtitles",toolId: "subtitle" },
    ],
  },
  {
    id: "youtube",
    icon: "▶️",
    title: "YouTube Upload Pack",
    desc: "1080p optimize → Thumbnail → Audio cleanup",
    gradient: "from-red-500 to-orange-500",
    badge: "⭐ Best Quality",
    firstTool: "convert",
    firstPreset: "youtube",
    steps: [
      { icon: "▶️", label: "1080p optimize", toolId: "convert",     preset: "youtube" },
      { icon: "📸", label: "Thumbnail",      toolId: "thumbnail" },
      { icon: "🎵", label: "Audio cleanup",  toolId: "audiostudio" },
    ],
  },
  {
    id: "whatsapp",
    icon: "💬",
    title: "WhatsApp Share Pack",
    desc: "Compress aggressively → Resize to 480p",
    gradient: "from-green-500 to-emerald-500",
    badge: "📱 Mobile Friendly",
    firstTool: "compress",
    firstPreset: undefined,
    steps: [
      { icon: "📦", label: "Compress max", toolId: "compress" },
      { icon: "📐", label: "Resize 480p",  toolId: "resize" },
    ],
  },
  {
    id: "podcast",
    icon: "🎙",
    title: "Podcast Clip Pack",
    desc: "Trim clip → Extract audio → Optimize",
    gradient: "from-violet-500 to-purple-600",
    badge: "🎧 Audio Focus",
    firstTool: "timeline",
    firstPreset: undefined,
    steps: [
      { icon: "✂️", label: "Trim clip",      toolId: "timeline" },
      { icon: "🎧", label: "Extract audio",  toolId: "audiostudio" },
      { icon: "⚡", label: "Auto optimize",  toolId: "autooptimize" },
    ],
  },
];

interface WorkflowTemplatesProps {
  onOpen: (toolId: string, preset?: string) => void;
}

const WorkflowTemplates = ({ onOpen }: WorkflowTemplatesProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-3"
  >
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      🎬 Workflow Templates — one click, full pipeline
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {TEMPLATES.map((t, i) => (
        <motion.button
          key={t.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07 }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpen(t.firstTool, t.firstPreset)}
          className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 hover:border-violet-300 dark:hover:border-violet-700 transition-all text-left p-4 space-y-3 shadow-sm hover:shadow-lg hover:shadow-violet-500/10"
        >
          {/* Gradient hover bg */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300",
            `bg-gradient-to-br ${t.gradient}`
          )} />

          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{t.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap hidden sm:inline",
              "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
            )}>{t.badge}</span>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-1 flex-wrap">
            {t.steps.map((step, si) => (
              <div key={step.toolId + si} className="flex items-center gap-1">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
                  {step.icon} {step.label}
                </span>
                {si < t.steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={cn(
            "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all",
            `bg-gradient-to-r ${t.gradient}`
          )}>
            Start workflow <ChevronRight className="w-3 h-3" />
          </div>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default WorkflowTemplates;
