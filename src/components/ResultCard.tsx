import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, Share2, CheckCheck, FileCheck2, ChevronRight } from "lucide-react";
import { useState } from "react";
import AnimatedButton from "@/components/ui/AnimatedButton";

interface NextAction {
  icon: string;
  label: string;
  toolId: string;
  preset?: string;
}

interface ResultCardProps {
  url: string;
  filename: string;
  size: string;
  onAgain: () => void;
  onReset: () => void;
  preview?: string;
  /** Next actions to show after result — drives tool chaining */
  nextActions?: NextAction[];
  onOpenTool?: (toolId: string, preset?: string) => void;
}

/** Build context-aware next actions based on filename/size */
export const buildNextActions = (
  filename: string,
  rawBytes: number,
  toolId: string
): NextAction[] => {
  const actions: NextAction[] = [];
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mb = rawBytes / (1024 * 1024);

  // Don't suggest the same tool
  if (toolId !== "compress" && mb > 20) {
    actions.push({ icon: "📦", label: "Reduce size more", toolId: "compress" });
  }
  if (toolId !== "convert" && ["mp4", "webm", "mov", "avi"].includes(ext)) {
    actions.push({ icon: "📱", label: "Optimize for TikTok", toolId: "convert", preset: "tiktok" });
  }
  if (toolId !== "subtitle") {
    actions.push({ icon: "💬", label: "Add subtitles", toolId: "subtitle" });
  }
  if (toolId !== "audiostudio") {
    actions.push({ icon: "🎧", label: "Extract audio", toolId: "audiostudio" });
  }
  if (toolId !== "thumbnail") {
    actions.push({ icon: "📸", label: "Create thumbnail", toolId: "thumbnail" });
  }
  return actions.slice(0, 4);
};

const ResultCard = ({
  url, filename, size, onAgain, onReset, preview, nextActions, onOpenTool,
}: ResultCardProps) => {
  const [shared, setShared] = useState(false);

  const download = () => {
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
  };

  const share = async () => {
    if (navigator.share) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: blob.type });
        await navigator.share({ files: [file], title: filename });
        setShared(true);
        setTimeout(() => setShared(false), 2200);
      } catch { download(); }
    } else { download(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="rounded-2xl overflow-hidden border border-green-200 dark:border-green-800/60 shadow-xl shadow-green-500/8"
    >
      {/* Success banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3.5 flex items-center gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.05 }}
          className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }} />
          </svg>
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Done! Your file is ready</p>
          <p className="text-green-100 text-xs truncate">{size} · {filename.split(".").pop()?.toUpperCase()}</p>
        </div>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}>
          <FileCheck2 className="w-5 h-5 text-white/80 shrink-0" />
        </motion.div>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-gray-900/80 p-4 sm:p-5 space-y-4">

        {/* GIF / image preview */}
        {preview && (
          <motion.img src={preview} alt="preview"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" />
        )}

        {/* File row */}
        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 sm:px-4 py-3 border border-gray-100 dark:border-gray-700/50">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{filename}</p>
            <p className="text-[10px] sm:text-xs text-gray-400">{size}</p>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={share}
            title={navigator.share ? "Share file" : "Download again"}
            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600 transition-colors shrink-0">
            <AnimatePresence mode="wait">
              {shared
                ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCheck className="w-3.5 h-3.5 text-green-500" /></motion.span>
                : <motion.span key="share" initial={{ scale: 0 }} animate={{ scale: 1 }}><Share2 className="w-3.5 h-3.5 text-gray-400" /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={download}
            className="flex items-center gap-1.5 btn-gradient ripple-btn text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-lg shadow-md shadow-violet-500/25 shrink-0">
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </motion.button>
        </div>

        {/* ── POST-CONVERSION FLOW ENGINE ── */}
        {nextActions && nextActions.length > 0 && onOpenTool && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="space-y-2"
          >
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              ✅ Your video is ready — what do you want next?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {nextActions.map((action, i) => (
                <motion.button
                  key={action.toolId + (action.preset ?? "")}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenTool(action.toolId, action.preset)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-violet-200 dark:border-violet-800/60 bg-violet-50/60 dark:bg-violet-950/20 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-all text-left group"
                >
                  <span className="text-base shrink-0">{action.icon}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors leading-tight flex-1">
                    {action.label}
                  </span>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-violet-500 shrink-0 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <AnimatedButton variant="outline" size="sm" onClick={onAgain} className="w-full text-xs sm:text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Process again
          </AnimatedButton>
          <AnimatedButton variant="ghost" size="sm" onClick={onReset} className="w-full text-xs sm:text-sm">
            Upload new file
          </AnimatedButton>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;
