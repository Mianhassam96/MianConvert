import { motion, AnimatePresence } from "framer-motion";

interface AnimatedProgressProps {
  value: number;
  label?: string;
  done?: boolean;
}

const AnimatedProgress = ({ value, label, done }: AnimatedProgressProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label || "Processing…"}</span>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500 font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} />
            </svg>
            Done!
          </motion.span>
        ) : (
          <motion.span key="pct" className="font-mono font-semibold text-violet-600">{value}%</motion.span>
        )}
      </AnimatePresence>
    </div>
    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full relative overflow-hidden"
        style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #d946ef)" }}
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-white/20"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  </div>
);

export default AnimatedProgress;
