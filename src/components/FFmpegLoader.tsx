import { motion, AnimatePresence } from "framer-motion";
import { useFFmpeg } from "@/hooks/use-ffmpeg";

/**
 * Global loading banner shown when FFmpeg WASM is being fetched.
 * Mounts once in App.tsx — visible across all tools.
 */
const FFmpegLoader = () => {
  const { loading, loadProgress } = useFFmpeg();

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -48 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
        >
          {/* Progress bar */}
          <div className="h-0.5 bg-gray-200 dark:bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500"
              initial={{ width: "0%" }}
              animate={{ width: `${loadProgress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Toast-style banner */}
          <div className="flex justify-center pt-2 px-4">
            <motion.div
              className="inline-flex items-center gap-3 bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800/60 rounded-2xl px-4 py-2.5 shadow-xl shadow-violet-500/10 backdrop-blur-xl"
            >
              {/* Spinner */}
              <div className="relative w-5 h-5 shrink-0">
                <svg className="w-5 h-5 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                  Loading FFmpeg WebAssembly…
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  First run only — {loadProgress}% complete
                </p>
              </div>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 tabular-nums shrink-0">
                {loadProgress}%
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FFmpegLoader;
