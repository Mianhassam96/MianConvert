import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Users } from "lucide-react";

// Simulated live counter — starts from a realistic base and increments
const BASE_COUNT = 3842;
const BASE_TIME = 3.8;

const useCounter = (base: number, interval: number, increment: () => number) => {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + increment()), interval);
    return () => clearInterval(id);
  }, []);
  return count;
};

const LiveStats = () => {
  const processed = useCounter(BASE_COUNT, 8000, () => Math.floor(Math.random() * 3) + 1);
  const [avgTime] = useState(BASE_TIME);
  const [prevProcessed, setPrevProcessed] = useState(processed);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (processed !== prevProcessed) {
      setFlash(true);
      setPrevProcessed(processed);
      setTimeout(() => setFlash(false), 600);
    }
  }, [processed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-6"
    >
      {/* Videos processed */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={processed}
                initial={{ y: flash ? -8 : 0, opacity: flash ? 0 : 1 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-black text-gray-900 dark:text-white tabular-nums"
              >
                {processed.toLocaleString()}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">videos processed today</p>
        </div>
      </div>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

      {/* Avg processing time */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Zap className="w-4 h-4 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 dark:text-white">{avgTime}s</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">avg processing time</p>
        </div>
      </div>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

      {/* Privacy */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Users className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 dark:text-white">0</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">files uploaded to servers</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveStats;
