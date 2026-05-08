/**
 * TimeSaved — shown after export completes.
 * Shows processing time + "X faster than traditional editors" psychology.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";

interface TimeSavedProps {
  startTime: number; // Date.now() when processing started
  savedBytes?: number; // bytes saved vs original
  originalBytes?: number;
}

const TimeSaved = ({ startTime, savedBytes, originalBytes }: TimeSavedProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed((Date.now() - startTime) / 1000);
  }, [startTime]);

  const elapsedStr = elapsed < 60
    ? `${elapsed.toFixed(1)}s`
    : `${Math.floor(elapsed / 60)}m ${Math.round(elapsed % 60)}s`;

  // Traditional editor estimate: ~3-5 min for same operation
  const traditionalMin = Math.max(2, Math.round(elapsed * 8));
  const savedMin = traditionalMin - Math.round(elapsed / 60);
  const savedStr = savedMin > 1 ? `~${savedMin}m faster` : `~${Math.round(elapsed * 7)}s faster`;

  const savingsPct = savedBytes && originalBytes && originalBytes > 0
    ? Math.round((savedBytes / originalBytes) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
      className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 border border-violet-200/60 dark:border-violet-800/40"
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <p className="text-xs font-black text-gray-900 dark:text-white">
            ⚡ Finished in {elapsedStr}
          </p>
          <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
            🔥 {savedStr} than traditional editors
          </p>
        </div>
      </div>

      {savingsPct > 0 && (
        <>
          <div className="w-px h-8 bg-violet-200 dark:bg-violet-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white">
                🔥 Saved {savingsPct}% file size
              </p>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                ⚡ Optimized for mobile sharing
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default TimeSaved;
