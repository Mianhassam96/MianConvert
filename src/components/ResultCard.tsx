import { motion } from "framer-motion";
import { Download, RefreshCw, Copy, CheckCheck } from "lucide-react";
import { useState } from "react";
import AnimatedButton from "@/components/ui/AnimatedButton";

interface ResultCardProps {
  url: string;
  filename: string;
  size: string;
  onAgain: () => void;
  onReset: () => void;
  preview?: string; // optional image preview (GIF)
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
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-2xl border-2 border-green-300 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 p-5 space-y-4"
    >
      {/* Success header */}
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
          className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
          </svg>
        </motion.div>
        <div>
          <p className="font-bold text-green-800 dark:text-green-300">Conversion complete!</p>
          <p className="text-xs text-green-600 dark:text-green-500">{size} · {filename.split(".").pop()?.toUpperCase()}</p>
        </div>
      </div>

      {/* GIF preview */}
      {preview && (
        <motion.img src={preview} alt="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full rounded-xl border border-green-200 dark:border-green-800" />
      )}

      {/* File info */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{filename}</p>
          <p className="text-xs text-gray-500">{size}</p>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={copy}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
          {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={download}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-md shadow-violet-500/20">
          <Download className="w-3.5 h-3.5" /> Download
        </motion.button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <AnimatedButton variant="outline" size="sm" onClick={onAgain} className="w-full">
          <RefreshCw className="w-3.5 h-3.5" /> Convert again
        </AnimatedButton>
        <AnimatedButton variant="ghost" size="sm" onClick={onReset} className="w-full">
          Upload new file
        </AnimatedButton>
      </div>
    </motion.div>
  );
};

export default ResultCard;
