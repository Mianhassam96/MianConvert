import { motion, AnimatePresence } from "framer-motion";

interface AnimatedProgressProps {
  value: number;
  label?: string;
  done?: boolean;
}

const AnimatedProgress = ({ value, label, done }: AnimatedProgressProps) => (
  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3.5 sm:p-4 border border-gray-100 dark:border-gray-700/50">
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400 font-medium truncate pr-2">
        {done ? "Processing complete" : (label || "Processing…")}
      </span>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.span key="done"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-green-500 font-bold flex items-center gap-1 shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }} />
            </svg>
            Done!
          </motion.span>
        ) : (
          <motion.span key="pct"
            className="font-mono font-bold text-violet-600 dark:text-violet-400 shrink-0 tabular-nums">
            {value}%
          </motion.span>
        )}
      </AnimatePresence>
    </div>

    {/* Track */}
    <div className="h-2 sm:h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full relative overflow-hidden"
        style={{ background: done
          ? "linear-gradient(90deg, #22c55e, #10b981)"
          : "linear-gradient(90deg, #7c3aed, #a855f7, #d946ef)" }}
        initial={{ width: "0%" }}
        animate={{ width: `${done ? 100 : value}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Shimmer */}
        {!done && (
          <motion.div
            className="absolute inset-0 bg-white/25"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.div>
    </div>

    {/* Step hint */}
    {!done && value > 0 && value < 100 && (
      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        {value < 30 ? "Loading & preparing…" : value < 70 ? "Processing frames…" : "Finalizing output…"}
      </p>
    )}
  </div>
);

export default AnimatedProgress;
