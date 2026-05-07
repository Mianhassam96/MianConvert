import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  icon: string;
  label: string;
  description: string;
  category: string;
  action: () => void;
  keywords: string[];
}

interface CommandPaletteProps {
  onOpenTool: (toolId: string, preset?: string) => void;
}

const CommandPalette = ({ onOpenTool }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const COMMANDS: Command[] = [
    // Tools
    { id: "convert",      icon: "🔄", label: "Convert video",        description: "Change format — MP4, WebM, MP3…",    category: "Tools",     keywords: ["convert","format","mp4","webm"],    action: () => onOpenTool("convert") },
    { id: "compress",     icon: "📦", label: "Compress video",        description: "Reduce file size up to 80%",         category: "Tools",     keywords: ["compress","size","reduce","small"],  action: () => onOpenTool("compress") },
    { id: "trim",         icon: "✂️", label: "Trim / cut video",      description: "Cut clips, set speed, loop",         category: "Tools",     keywords: ["trim","cut","clip","speed"],         action: () => onOpenTool("timeline") },
    { id: "resize",       icon: "📐", label: "Resize video",          description: "Change resolution or aspect ratio",  category: "Tools",     keywords: ["resize","resolution","scale","crop"], action: () => onOpenTool("resize") },
    { id: "subtitle",     icon: "💬", label: "Add subtitles",         description: "Burn SRT captions into video",       category: "Tools",     keywords: ["subtitle","caption","srt","text"],   action: () => onOpenTool("subtitle") },
    { id: "thumbnail",    icon: "📸", label: "Create thumbnail",      description: "Extract frame + add title text",     category: "Tools",     keywords: ["thumbnail","frame","image","jpg"],   action: () => onOpenTool("thumbnail") },
    { id: "audio",        icon: "🎧", label: "Extract audio",         description: "Save audio as MP3, WAV or AAC",      category: "Tools",     keywords: ["audio","extract","mp3","wav"],       action: () => onOpenTool("audiostudio") },
    { id: "gif",          icon: "🎞", label: "Make GIF",              description: "Convert video clip to animated GIF", category: "Tools",     keywords: ["gif","animate","loop"],              action: () => onOpenTool("gif") },
    { id: "overlay",      icon: "🧩", label: "Add overlay / text",    description: "Text, logos, watermarks & layers",   category: "Tools",     keywords: ["overlay","text","logo","watermark"], action: () => onOpenTool("overlay") },
    { id: "merge",        icon: "🔗", label: "Merge videos",          description: "Combine multiple videos into one",   category: "Tools",     keywords: ["merge","combine","join","concat"],   action: () => onOpenTool("merge") },
    { id: "proeditor",    icon: "🎬", label: "Pro Editor",            description: "Filters, color grading, crop",       category: "Tools",     keywords: ["filter","color","grade","edit"],     action: () => onOpenTool("proeditor") },
    { id: "autooptimize", icon: "⚡", label: "Auto Optimize",         description: "1-click smart optimization",         category: "Tools",     keywords: ["auto","optimize","smart","1click"],  action: () => onOpenTool("autooptimize") },
    { id: "aicaption",    icon: "✨", label: "AI Captions",            description: "Auto-generate TikTok/Reel captions",  category: "Tools",     keywords: ["caption","subtitle","ai","tiktok","reel","auto"], action: () => onOpenTool("aicaption") },
    // Presets
    { id: "p-tiktok",     icon: "📱", label: "TikTok preset",         description: "MP4 · 720p · vertical-ready",        category: "Presets",   keywords: ["tiktok","vertical","9:16","short"],  action: () => onOpenTool("convert", "tiktok") },
    { id: "p-youtube",    icon: "▶️", label: "YouTube 1080p preset",  description: "MP4 · 1080p · high quality",         category: "Presets",   keywords: ["youtube","1080p","hd","upload"],     action: () => onOpenTool("convert", "youtube") },
    { id: "p-whatsapp",   icon: "💬", label: "WhatsApp preset",       description: "MP4 · 480p · small file",            category: "Presets",   keywords: ["whatsapp","small","mobile","share"],  action: () => onOpenTool("convert", "whatsapp") },
    { id: "p-instagram",  icon: "📸", label: "Instagram Reel preset", description: "MP4 · 720p · balanced",              category: "Presets",   keywords: ["instagram","reel","story","square"],  action: () => onOpenTool("convert", "instagram") },
    { id: "p-mp3",        icon: "🎵", label: "Extract as MP3",        description: "Audio only — MP3 format",            category: "Presets",   keywords: ["mp3","audio","extract","music"],     action: () => onOpenTool("convert", "audio_mp3") },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : COMMANDS;

  // Group by category
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flat = filtered;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && flat[selected]) {
      flat[selected].action();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <>
      {/* Trigger hint */}
      <button
        onClick={() => { setOpen(true); setQuery(""); setSelected(0); }}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 text-xs text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-all"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search tools…</span>
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[61] w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search tools, presets, actions…"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  {query && (
                    <button onClick={() => setQuery("")}>
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono text-gray-400">ESC</kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {flat.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No results for "{query}"</div>
                ) : (
                  Object.entries(grouped).map(([category, cmds]) => (
                    <div key={category}>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {category}
                      </p>
                      {cmds.map(cmd => {
                        const globalIdx = flat.indexOf(cmd);
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => { cmd.action(); setOpen(false); setQuery(""); }}
                            onMouseEnter={() => setSelected(globalIdx)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                              globalIdx === selected
                                ? "bg-violet-50 dark:bg-violet-950/30"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            )}
                          >
                            <span className="text-lg shrink-0">{cmd.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-semibold", globalIdx === selected ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-100")}>
                                {cmd.label}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{cmd.description}</p>
                            </div>
                            <ChevronRight className={cn("w-4 h-4 shrink-0 transition-colors", globalIdx === selected ? "text-violet-500" : "text-gray-300")} />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">↵</kbd> open</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-400" /> {flat.length} commands</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandPalette;
