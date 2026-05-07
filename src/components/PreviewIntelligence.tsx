import { motion } from "framer-motion";
import { formatBytes } from "@/lib/ffmpeg-run";
import { AlertTriangle, Info } from "lucide-react";

interface PreviewIntelligenceProps {
  file: File;
  duration: number;
  width: number;
  height: number;
}

const fmt = (s: number) => {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
};

const getWarning = (file: File, duration: number, width: number): string | null => {
  const mb = file.size / (1024 * 1024);
  if (mb > 500) return `Very large file (${formatBytes(file.size)}) — may be slow to process on mobile`;
  if (mb > 100) return `Large file (${formatBytes(file.size)}) — consider compressing before sharing`;
  if (duration > 600) return `Long video (${fmt(duration)}) — consider trimming to the best part`;
  if (width > 3840) return `4K resolution — consider resizing to 1080p for faster processing`;
  return null;
};

const PreviewIntelligence = ({ file, duration, width, height }: PreviewIntelligenceProps) => {
  const warning = getWarning(file, duration, width);
  const mb = file.size / (1024 * 1024);

  const stats = [
    { label: "Size",       value: formatBytes(file.size),                    color: mb > 100 ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-200" },
    { label: "Duration",   value: duration > 0 ? fmt(duration) : "—",        color: "text-gray-700 dark:text-gray-200" },
    { label: "Resolution", value: width > 0 ? `${width}×${height}` : "—",    color: "text-gray-700 dark:text-gray-200" },
    { label: "Format",     value: file.name.split(".").pop()?.toUpperCase() ?? "—", color: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      {/* File stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="glass-panel px-3 py-2.5 text-center">
            <p className={`text-xs font-bold truncate ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Warning if needed */}
      {warning && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2.5"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{warning}</span>
        </motion.div>
      )}

      {/* All good */}
      {!warning && duration > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 rounded-xl px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>File looks good — ready to process</span>
        </div>
      )}
    </motion.div>
  );
};

export default PreviewIntelligence;
