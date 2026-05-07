import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DropZone from "@/components/DropZone";
import UseCaseBar from "@/components/UseCaseBar";
import SmartSuggestions from "@/components/SmartSuggestions";
import LiveStats from "@/components/LiveStats";
import SessionTimeline from "@/components/SessionTimeline";
import PreviewIntelligence from "@/components/PreviewIntelligence";
import ActivityFeed from "@/components/ActivityFeed";
import WorkflowTemplates from "@/components/WorkflowTemplates";
import RecentWorkflows from "@/components/RecentWorkflows";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import RenderQueuePanel from "@/components/RenderQueuePanel";
import CreatorPacks from "@/components/CreatorPacks";
import { Link } from "react-router-dom";
import { fadeUp, stagger, scaleIn, tabPanel } from "@/lib/motion";
import { Shield, Zap, Search, Star, X, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { sessionStore } from "@/lib/session-store";
import { useSession } from "@/hooks/use-session";
import { workspaceMemory } from "@/lib/workspace-memory";
import { probeAndStore } from "@/lib/ffmpeg-run";
import { projectStore } from "@/lib/project-store";

// ── Lazy-loaded tool components (only loaded when tool is opened) ─────────────
const ProEditorTool    = lazy(() => import("@/components/tools/ProEditorTool"));
const TimelineTool     = lazy(() => import("@/components/tools/TimelineTool"));
const OverlayStudioTool= lazy(() => import("@/components/tools/OverlayStudioTool"));
const CleanVideoTool   = lazy(() => import("@/components/tools/CleanVideoTool"));
const ConvertTool      = lazy(() => import("@/components/tools/ConvertTool"));
const CompressTool     = lazy(() => import("@/components/tools/CompressTool"));
const ResizeTool       = lazy(() => import("@/components/tools/ResizeTool"));
const GifTool          = lazy(() => import("@/components/tools/GifTool"));
const AudioStudioTool  = lazy(() => import("@/components/tools/AudioStudioTool"));
const MergeTool        = lazy(() => import("@/components/tools/MergeTool"));
const SubtitleTool     = lazy(() => import("@/components/tools/SubtitleTool"));
const ThumbnailTool    = lazy(() => import("@/components/tools/ThumbnailTool"));
const AutoOptimizeTool = lazy(() => import("@/components/tools/AutoOptimizeTool"));
const AICaptionTool    = lazy(() => import("@/components/tools/AICaptionTool"));
const SilenceRemoverTool = lazy(() => import("@/components/tools/SilenceRemoverTool"));

interface ToolDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  tags: string[];
  gradient: string;
  iconBg: string;
}

const TOOL_SECTIONS = [
  {
    id: "edit", label: "Edit Tools", emoji: "🎬",
    accent: "from-violet-600 to-purple-600",
    cols: "grid-cols-1 sm:grid-cols-2",
    tools: [
      { id: "proeditor",    icon: "🎬", label: "Pro Editor",     desc: "Filters, color grading, crop & effects",                       tags: ["filter","color","crop","edit"],                    gradient: "from-violet-500 to-purple-600",  iconBg: "bg-violet-100 dark:bg-violet-900/40"  },
      { id: "timeline",     icon: "✂️", label: "Timeline",       desc: "Trim, cut, speed control & loop",                              tags: ["trim","cut","speed","loop","clip"],                gradient: "from-purple-500 to-indigo-600",  iconBg: "bg-purple-100 dark:bg-purple-900/40"  },
      { id: "overlay",      icon: "🧩", label: "Overlay Studio", desc: "Text, logos, watermarks & layers",                             tags: ["text","logo","watermark","overlay"],               gradient: "from-fuchsia-500 to-violet-600", iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40"},
      { id: "clean",        icon: "🧹", label: "Clean Video",    desc: "Remove unwanted text or logo",                                 tags: ["remove","clean","logo","delogo"],                  gradient: "from-pink-500 to-fuchsia-600",   iconBg: "bg-pink-100 dark:bg-pink-900/40"      },
    ] as ToolDef[],
  },
  {
    id: "convert", label: "Convert Tools", emoji: "🔄",
    accent: "from-blue-600 to-cyan-500",
    cols: "grid-cols-1 sm:grid-cols-2",
    tools: [
      { id: "convert",      icon: "🔄", label: "Convert",        desc: "MP4, WebM, AVI, MOV, MKV, MP3, WAV",                          tags: ["convert","format","mp4","webm","mp3"],             gradient: "from-blue-500 to-cyan-500",    iconBg: "bg-blue-100 dark:bg-blue-900/40"   },
      { id: "compress",     icon: "📦", label: "Compress",       desc: "Reduce file size without losing quality",                      tags: ["compress","size","reduce"],                        gradient: "from-cyan-500 to-teal-500",    iconBg: "bg-cyan-100 dark:bg-cyan-900/40"   },
      { id: "resize",       icon: "📐", label: "Resize",         desc: "Resolution, aspect ratio & letterbox",                         tags: ["resize","resolution","aspect","scale"],            gradient: "from-teal-500 to-emerald-500", iconBg: "bg-teal-100 dark:bg-teal-900/40"   },
      { id: "gif",          icon: "🎞", label: "GIF Maker",      desc: "Convert video to animated GIF",                               tags: ["gif","animate","convert"],                         gradient: "from-sky-500 to-blue-600",     iconBg: "bg-sky-100 dark:bg-sky-900/40"     },
    ] as ToolDef[],
  },
  {
    id: "audio", label: "Audio Studio", emoji: "🎵",
    accent: "from-fuchsia-600 to-pink-500",
    cols: "grid-cols-1",
    tools: [
      { id: "audiostudio",  icon: "🎵", label: "Audio Studio",   desc: "Mute, extract, volume boost, fade in/out & convert audio",     tags: ["audio","mute","extract","volume","fade","convert"],gradient: "from-fuchsia-500 to-pink-500", iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40"},
    ] as ToolDef[],
  },
  {
    id: "advanced", label: "Advanced Tools", emoji: "⚡",
    accent: "from-orange-500 to-amber-500",
    cols: "grid-cols-1 sm:grid-cols-3",
    tools: [
      { id: "merge",        icon: "🔗", label: "Merge",          desc: "Combine multiple videos into one",                             tags: ["merge","combine","join"],                          gradient: "from-orange-500 to-amber-500",  iconBg: "bg-orange-100 dark:bg-orange-900/40"},
      { id: "subtitle",     icon: "💬", label: "Subtitle",       desc: "Burn SRT captions into video",                                tags: ["subtitle","caption","srt","text"],                 gradient: "from-amber-500 to-yellow-500",  iconBg: "bg-amber-100 dark:bg-amber-900/40" },
      { id: "thumbnail",    icon: "🖼", label: "Thumbnail",      desc: "Extract frame & add title text",                              tags: ["thumbnail","frame","image","jpg"],                 gradient: "from-yellow-500 to-orange-500", iconBg: "bg-yellow-100 dark:bg-yellow-900/40"},
    ] as ToolDef[],
  },
  {
    id: "smart", label: "Smart Tools", emoji: "🧠",
    accent: "from-violet-600 to-fuchsia-600",
    cols: "grid-cols-1 sm:grid-cols-3",
    tools: [
      { id: "autooptimize",   icon: "⚡", label: "Auto Optimize",    desc: "1-click: detect & apply best format, compression & resolution", tags: ["auto","optimize","smart","1click"],          gradient: "from-violet-600 to-fuchsia-600", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
      { id: "aicaption",      icon: "✨", label: "AI Captions",      desc: "Auto-generate captions with TikTok, Reel & YouTube styles",    tags: ["caption","subtitle","ai","tiktok","reel"],  gradient: "from-fuchsia-600 to-pink-600",   iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40" },
      { id: "silenceremover", icon: "🔇", label: "Silence Remover",  desc: "Auto-remove silent sections from video or audio",              tags: ["silence","remove","podcast","audio","cut"],  gradient: "from-slate-600 to-gray-700",    iconBg: "bg-slate-100 dark:bg-slate-900/40" },
    ] as ToolDef[],
  },
];

const ALL_TOOLS: ToolDef[] = TOOL_SECTIONS.flatMap(s => s.tools);

const TRUST_ITEMS = [
  { icon: <Lock className="w-3.5 h-3.5" />,   text: "Runs locally (FFmpeg in browser)" },
  { icon: <Zap className="w-3.5 h-3.5" />,    text: "Super fast processing" },
  { icon: <Shield className="w-3.5 h-3.5" />, text: "Files never leave your device" },
];

const STATS = [
  { value: "15",   label: "Tools",    emoji: "🛠" },
  { value: "10+",  label: "Formats",  emoji: "🎞" },
  { value: "0",    label: "Uploads",  emoji: "🔒" },
  { value: "100%", label: "Private",  emoji: "✅" },
];

// ── Tool Card ─────────────────────────────────────────────────────────────────
const ToolCard = ({
  tool, onOpen, isFav, onToggleFav,
}: {
  tool: ToolDef;
  onOpen: (id: string) => void;
  isFav: boolean;
  onToggleFav: (id: string) => void;
}) => (
  <motion.div
    variants={scaleIn}
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="group relative glass-card p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10 gradient-border"
    onClick={() => onOpen(tool.id)}
  >
    <div className={cn(
      "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl",
      `bg-gradient-to-br ${tool.gradient}`
    )} />

    <button
      onClick={e => { e.stopPropagation(); onToggleFav(tool.id); }}
      className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <Star className={cn(
        "w-3.5 h-3.5 transition-colors",
        isFav ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600 group-hover:text-gray-400"
      )} />
    </button>

    <div className="space-y-3">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110",
        tool.iconBg
      )}>
        {tool.icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight mb-1">
          {tool.label}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tool.desc}</p>
      </div>
      <div className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200",
        `bg-gradient-to-r ${tool.gradient} text-white shadow-sm opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0`
      )}>
        Open Tool <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  </motion.div>
);

// ── Section ───────────────────────────────────────────────────────────────────
const ToolSection = ({
  section, onOpen, favs, onToggleFav,
}: {
  section: typeof TOOL_SECTIONS[0];
  onOpen: (id: string) => void;
  favs: Set<string>;
  onToggleFav: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="space-y-4"
  >
    <div className="flex items-center gap-3">
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-md",
        `bg-gradient-to-r ${section.accent}`
      )}>
        <span>{section.emoji}</span>
        <span>{section.label}</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
        {section.tools.length} tool{section.tools.length > 1 ? "s" : ""}
      </span>
    </div>
    <motion.div
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden" whileInView="show" viewport={{ once: true }}
      className={cn("grid gap-3 sm:gap-4", section.cols)}
    >
      {section.tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} onOpen={onOpen} isFav={favs.has(tool.id)} onToggleFav={onToggleFav} />
      ))}
    </motion.div>
  </motion.div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [favs, setFavs] = useState<Set<string>>(() => new Set(workspaceMemory.getFavTools()));
  const toolPanelRef = useRef<HTMLDivElement>(null);
  const session = useSession();

  const toggleFav = (id: string) => {
    setFavs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      workspaceMemory.setFavTools([...n]);
      return n;
    });
  };

  const openTool = (id: string, preset?: string) => {
    setActiveTool(id);
    setActivePreset(preset);
    // Save to workspace memory for recent workflows
    const toolDef = ALL_TOOLS.find(t => t.id === id);
    if (toolDef) {
      workspaceMemory.addWorkflow({
        id: `${id}-${preset ?? "default"}`,
        label: preset ? `${toolDef.label} (${preset})` : toolDef.label,
        icon: toolDef.icon,
        toolId: id,
        preset,
      });
      if (preset) workspaceMemory.addPreset(preset);
    }
    setTimeout(() => {
      if (toolPanelRef.current) {
        const top = toolPanelRef.current.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 120);
  };

  const closeTool = () => { setActiveTool(null); setActivePreset(undefined); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeTool(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Listen for openTool events dispatched from ResultCard next-actions
  useEffect(() => {
    const handler = (e: Event) => {
      const { toolId, preset } = (e as CustomEvent).detail;
      if (toolId) openTool(toolId, preset);
    };
    window.addEventListener("openTool", handler);
    return () => window.removeEventListener("openTool", handler);
  }, []);

  const activeDef = ALL_TOOLS.find(t => t.id === activeTool);

  const searchLower = search.toLowerCase().trim();
  const filteredSections = searchLower
    ? TOOL_SECTIONS.map(s => ({
        ...s,
        tools: s.tools.filter(t =>
          t.label.toLowerCase().includes(searchLower) ||
          t.desc.toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.includes(searchLower))
        ),
      })).filter(s => s.tools.length > 0)
    : TOOL_SECTIONS;

  const favTools = ALL_TOOLS.filter(t => favs.has(t.id));

  // Render the active tool component — lazy loaded by ID
  const renderActiveTool = () => {
    if (!activeDef) return null;
    switch (activeDef.id) {
      case "proeditor":    return <ProEditorTool />;
      case "timeline":     return <TimelineTool />;
      case "overlay":      return <OverlayStudioTool />;
      case "clean":        return <CleanVideoTool />;
      case "convert":      return <ConvertTool initialPreset={activePreset} />;
      case "compress":     return <CompressTool />;
      case "resize":       return <ResizeTool />;
      case "gif":          return <GifTool />;
      case "audiostudio":  return <AudioStudioTool />;
      case "merge":        return <MergeTool />;
      case "subtitle":     return <SubtitleTool />;
      case "thumbnail":    return <ThumbnailTool />;
      case "autooptimize": return <AutoOptimizeTool />;
      case "aicaption":       return <AICaptionTool />;
      case "silenceremover":  return <SilenceRemoverTool />;
      default:                return null;
    }
  };

  // Build session timeline steps
  const TIMELINE_STEPS = [
    { id: "upload",      icon: "📂", label: "Uploaded",   done: !!session.file },
    { id: "convert",     icon: "🔄", label: "Converted",  done: session.completedTools.includes("convert") },
    { id: "compress",    icon: "📦", label: "Compressed", done: session.completedTools.includes("compress") },
    { id: "subtitle",    icon: "💬", label: "Subtitled",  done: session.completedTools.includes("subtitle") },
    { id: "thumbnail",   icon: "📸", label: "Thumbnail",  done: session.completedTools.includes("thumbnail") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0b14] transition-colors relative overflow-x-hidden">

      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-500/8 dark:bg-violet-600/12 blur-3xl" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-fuchsia-500/8 dark:bg-fuchsia-600/12 blur-3xl" />
        <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-blue-500/5 dark:bg-blue-600/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(124,58,237,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.06)_1px,transparent_1px)]" />
      </div>

      <Header />

      {/* Workspace sidebar + render queue — always mounted */}
      <WorkspaceSidebar onOpenTool={openTool} />
      <RenderQueuePanel />

      <main className="flex-grow px-3 sm:px-4 py-6 sm:py-10">
        <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">

          {/* ── HERO ── */}
          <motion.section variants={stagger} initial="hidden" animate="show" className="text-center space-y-5 pt-2 sm:pt-4">

            <motion.div variants={fadeUp} className="flex justify-center">
              <span className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300 shadow-sm shadow-violet-500/10">
                <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }} className="text-base">⚡</motion.span>
                Powered by FFmpeg WebAssembly — 100% in your browser
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                The fastest way to prepare
              </h1>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent text-glow">
                  videos for anywhere
                </span>
              </h1>
            </motion.div>

            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed px-2">
              Your browser-based video workspace. No upload. No signup. No limits. — 13 professional tools that run entirely on your device.
            </motion.p>

            {/* Trust line */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2">
              {TRUST_ITEMS.map(f => (
                <span key={f.text} className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                  <span className="text-violet-500">{f.icon}</span>{f.text}
                </span>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm sm:max-w-lg mx-auto">
              {STATS.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  whileHover={{ y: -3, scale: 1.04 }}
                  className="stat-card">
                  <p className="text-lg sm:text-2xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent leading-none mb-0.5">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 text-sm">
              <Link to="/about" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors flex items-center gap-1">
                Learn more
                <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
              </Link>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <Link to="/contact" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Contact</Link>
            </motion.div>

            {/* Live Stats */}
            <motion.div variants={fadeUp}>
              <LiveStats />
            </motion.div>
          </motion.section>

          {/* ── AUTO OPTIMIZE HERO BUTTON ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => openTool("autooptimize")}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-white text-sm shadow-xl shadow-violet-500/30 transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)", backgroundSize: "200% 200%", animation: "gradientShift 4s ease infinite" }}
            >
              <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>⚡</motion.span>
              Auto Optimize (1 Click)
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">NEW</span>
            </motion.button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center sm:text-left">
              Detects format, size & resolution — applies best settings automatically
            </p>
          </motion.div>

          {/* ── HERO DROP ZONE ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <DropZone
              variant="hero"
              onFile={(f) => {
                probeAndStore(f);
                projectStore.setSource(f.name);
                (window as any).__quickDropFile = f;
                openTool("convert");
              }}
            />
          </motion.div>

          {/* ── SMART SUGGESTIONS (after file uploaded) ── */}
          <AnimatePresence>
            {session.file && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                className="space-y-3">
                {/* Preview Intelligence */}
                <PreviewIntelligence
                  file={session.file}
                  duration={session.duration}
                  width={session.width}
                  height={session.height}
                />
                <SmartSuggestions
                  file={session.file}
                  duration={session.duration}
                  width={session.width}
                  height={session.height}
                  suggestions={session.suggestions}
                  onOpen={openTool}
                />
                {/* Session Timeline */}
                <SessionTimeline
                  steps={TIMELINE_STEPS}
                  onOpenTool={openTool}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── USE CASE BAR ── */}
          <UseCaseBar onOpen={openTool} />

          {/* ── WORKFLOW TEMPLATES ── */}
          <WorkflowTemplates onOpen={openTool} />

          {/* ── CREATOR PACKS ── */}
          <CreatorPacks onOpen={openTool} />

          {/* ── RECENT WORKFLOWS (from memory) ── */}
          <RecentWorkflows onOpen={openTool} />

          {/* ── ACTIVITY FEED + TRENDING ── */}
          <ActivityFeed />

          {/* ── SEARCH BAR ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools… (e.g. compress, subtitle, gif)"
              className="w-full pl-11 pr-10 py-3 sm:py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </motion.div>

          {/* ── FAVORITES ── */}
          <AnimatePresence>
            {favTools.length > 0 && !searchLower && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold shadow-md">
                    <Star className="w-4 h-4 fill-white" />
                    <span>Favorites</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-200 dark:from-amber-800 to-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {favTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} onOpen={openTool} isFav={true} onToggleFav={toggleFav} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TOOL SECTIONS ── */}
          <div className="space-y-8 sm:space-y-10">
            {filteredSections.map(section => (
              <ToolSection key={section.id} section={section} onOpen={openTool} favs={favs} onToggleFav={toggleFav} />
            ))}
            {filteredSections.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-3">
                <p className="text-4xl">🔍</p>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No tools found for "{search}"</p>
                <button onClick={() => setSearch("")} className="text-violet-500 text-sm hover:underline">Clear search</button>
              </motion.div>
            )}
          </div>

          {/* ── ACTIVE TOOL PANEL ── */}
          <AnimatePresence>
            {activeTool && activeDef && (
              <motion.div
                ref={toolPanelRef}
                key={activeTool}
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="glass-card overflow-hidden"
              >
                <div className={cn(
                  "flex items-center gap-3 px-4 sm:px-6 py-4 text-white",
                  `bg-gradient-to-r ${activeDef.gradient}`
                )}>
                  <motion.span
                    initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="text-2xl sm:text-3xl leading-none shrink-0">
                    {activeDef.icon}
                  </motion.span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-black text-base sm:text-lg leading-tight">{activeDef.label}</h2>
                    <p className="text-white/80 text-xs sm:text-sm truncate">{activeDef.desc}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={closeTool}
                    className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="p-4 sm:p-6">
                  <AnimatePresence mode="wait">
                    <motion.div key={`${activeTool}-${activePreset}`} variants={tabPanel} initial="hidden" animate="show" exit="exit">
                      <Suspense fallback={
                        <div className="flex items-center justify-center py-12 gap-3 text-gray-400 dark:text-gray-500">
                          <svg className="w-5 h-5 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-sm font-medium">Loading tool…</span>
                        </div>
                      }>
                        {renderActiveTool()}
                      </Suspense>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── HOW IT WORKS ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="glass-card p-5 sm:p-8"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-5 text-center">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { n: "1", emoji: "📂", title: "Upload", desc: "Drag & drop or click to pick your video. It never leaves your device." },
                { n: "2", emoji: "⚙️", title: "Process", desc: "Pick a tool, tweak settings. FFmpeg WASM handles everything in-browser." },
                { n: "3", emoji: "⬇️", title: "Download", desc: "Your file is ready instantly. Download it — no waiting, no account." },
              ].map((s, i) => (
                <motion.div key={s.n}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex gap-3 sm:flex-col sm:gap-2 sm:text-center sm:items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/25">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.emoji} {s.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
