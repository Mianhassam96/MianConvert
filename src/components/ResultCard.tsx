import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, Copy, CheckCheck, FileCheck2 } from "lucide-react";
import { useState } from "react";
import AnimatedButton from "@/components/ui/AnimatedButton";

interface ResultCardProps {
  url: string;
  filename: string;
  size: string;
  onAgain: () => void;
  onReset: () => void;
  preview?: string;
}

const ResultCard = ({ url, filename, size, onAgain, onReset, preview }: ResultCardProps) => {
  const [copied, setCopied] = useState(false);

  const download = () => {
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
  };

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
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
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}>
          <FileCheck2 className="w-5 h-5 text-white/80 shrink-0" />
        </motion.div>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-gray-900/80 p-4 sm:p-5 space-y-4">

        {/* GIF preview */}
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
          {/* Copy */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={copy}
            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600 transition-colors shrink-0">
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCheck className="w-3.5 h-3.5 text-green-500" /></motion.span>
                : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy className="w-3.5 h-3.5 text-gray-400" /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
          {/* Download */}
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={download}
            className="flex items-center gap-1.5 btn-gradient ripple-btn text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-lg shadow-md shadow-violet-500/25 shrink-0">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Download</span>
          </motion.button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <AnimatedButton variant="outline" size="sm" onClick={onAgain} className="w-full text-xs sm:text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Convert again
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
