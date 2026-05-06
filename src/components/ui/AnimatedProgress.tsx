import { motion, AnimatePresence } from "framer-motion";

interface AnimatedProgressProps {
  value: number;
  label?: string;
  done?: boolean;
  stages?: boolean;
}

const STAGES = [
  { label: "Uploading",  threshold: 0  },
  { label: "Processing", threshold: 15 },
  { label: "Optimizing",threshold: 50 },
  { label: "Finalizing", threshold: 80 },
];

const getStageLabel = (value: number): string => {
  if (value < 15) return "Uploading to memory…";
  if (value < 50) return "Processing frames…";
  if (value < 80) return "Optimizing output…";
  return "Finalizing…";
};

const AnimatedProgress = ({ value, label, done, stages = false }: AnimatedProgressProps) => (
  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3.5 sm:p-4 border border-gray-100 dark:border-gray-700/50">
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400 font-medium truncate pr-2">
        {done ? "Processing complete" : stages ? getStageLabel(value) : (label || "Processing…")}
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
          <motion.span key="pct" className="font-mono font-bold text-violet-600 dark:text-violet-400 shrink-0 tabular-nums">
            {value}%
          </motion.span>
        )}
      </AnimatePresence>
    </div>

    {/* Stage dots */}
    {stages && !done && (
      <div className="flex items-center gap-1 mb-1 overflow-x-auto scrollbar-hide">
        {STAGES.map((s, i) => {
          const active = value >= s.threshold;
          const next = STAGES[i + 1];
          const current = active && (!next || value < next.threshold);
          return (
            <div key={s.label} className="flex items-center gap-1 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                active ? "bg-violet-500" : "bg-gray-300 dark:bg-gray-600"
              } ${current ? "scale-125" : ""}`} />
              <span className={`text-[9px] font-medium transition-colors whitespace-nowrap ${
                current ? "text-violet-600 dark:text-violet-400" :
                active ? "text-gray-500 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"
              }`}>{s.label}</span>
              {i < STAGES.length - 1 && (
                <div className={`w-3 h-px transition-colors ${
                  value >= (STAGES[i + 1]?.threshold ?? 100) ? "bg-violet-400" : "bg-gray-200 dark:bg-gray-700"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    )}

    {/* Track */}
    <div className="h-2 sm:h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full relative overflow-hidden"
        style={{
          background: done
            ? "linear-gradient(90deg, #22c55e, #10b981)"
            : "linear-gradient(90deg, #7c3aed, #a855f7, #d946ef)",
        }}
        initial={{ width: "0%" }}
        animate={{ width: `${done ? 100 : value}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {!done && (
          <motion.div
            className="absolute inset-0 bg-white/25"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.div>
    </div>

    {!stages && !done && value > 0 && value < 100 && (
      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        {value < 30 ? "Loading & preparing…" : value < 70 ? "Processing frames…" : "Finalizing output…"}
      </p>
    )}
  </div>
);

export default AnimatedProgress;
