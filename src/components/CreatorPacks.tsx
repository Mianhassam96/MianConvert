import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronRight } from "lucide-react";

interface CreatorPack {
  id: string;
  icon: string;
  name: string;
  creator: string;
  desc: string;
  gradient: string;
  tags: string[];
  toolId: string;
  preset?: string;
  hot?: boolean;
}

const PACKS: CreatorPack[] = [
  {
    id: "hormozi",
    icon: "💪",
    name: "Alex Hormozi Style",
    creator: "Business Creator",
    desc: "Bold white captions, high contrast, punchy cuts",
    gradient: "from-orange-500 to-red-600",
    tags: ["Bold captions", "High contrast", "Business"],
    toolId: "aicaption",
    hot: true,
  },
  {
    id: "viral-reel",
    icon: "🔥",
    name: "Viral Reel Style",
    creator: "Instagram / TikTok",
    desc: "9:16 crop, neon captions, fast-paced energy",
    gradient: "from-pink-500 to-fuchsia-600",
    tags: ["9:16 vertical", "Neon text", "TikTok"],
    toolId: "convert",
    preset: "tiktok",
    hot: true,
  },
  {
    id: "podcast-clip",
    icon: "🎙",
    name: "Podcast Clip Style",
    creator: "Podcast / Long-form",
    desc: "Clean lower-third captions, minimal design",
    gradient: "from-violet-500 to-purple-600",
    tags: ["Lower thirds", "Minimal", "Audio"],
    toolId: "aicaption",
  },
  {
    id: "youtube-clean",
    icon: "▶️",
    name: "YouTube Clean HD",
    creator: "YouTube Creator",
    desc: "1080p export, clean subtitles, thumbnail ready",
    gradient: "from-red-500 to-orange-500",
    tags: ["1080p HD", "Clean subs", "Thumbnail"],
    toolId: "convert",
    preset: "youtube",
  },
  {
    id: "tiktok-story",
    icon: "📱",
    name: "TikTok Story Style",
    creator: "Short-form Creator",
    desc: "Vertical crop, bold captions, compressed for upload",
    gradient: "from-cyan-500 to-blue-600",
    tags: ["Vertical", "Bold", "Compressed"],
    toolId: "aicaption",
  },
  {
    id: "discord-clip",
    icon: "🎮",
    name: "Discord / Gaming Clip",
    creator: "Gaming Creator",
    desc: "Under 8MB, neon captions, fast export",
    gradient: "from-indigo-500 to-violet-600",
    tags: ["Under 8MB", "Neon", "Gaming"],
    toolId: "compress",
  },
];

interface CreatorPacksProps {
  onOpen: (toolId: string, preset?: string) => void;
}

const CreatorPacks = ({ onOpen }: CreatorPacksProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-3"
  >
    <div className="flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-violet-500" />
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Creator Packs — signature styles
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {PACKS.map((pack, i) => (
        <motion.button
          key={pack.id}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpen(pack.toolId, pack.preset)}
          className="group relative overflow-hidden rounded-2xl text-left transition-all"
        >
          {/* Gradient background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-90",
            pack.gradient
          )} />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <div className="relative z-10 p-4 space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{pack.icon}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white leading-tight">{pack.name}</p>
                    {pack.hot && (
                      <span className="text-[9px] font-bold bg-white/25 text-white px-1.5 py-0.5 rounded-full">
                        🔥 HOT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/70 mt-0.5">{pack.creator}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-white/80 leading-relaxed">{pack.desc}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {pack.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1 text-xs font-bold text-white/90 group-hover:text-white transition-colors">
              Use this pack
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default CreatorPacks;
