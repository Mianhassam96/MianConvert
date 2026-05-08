/**
 * CreatorStats — shows session stats and creator milestones.
 * Makes the product feel alive and creates retention psychology.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Zap } from "lucide-react";
import { workspaceMemory } from "@/lib/workspace-memory";

const KEY_TOTAL = "mc_total_processed";
const KEY_WEEK  = "mc_week_processed";
const KEY_WEEK_START = "mc_week_start";

const getWeekStats = () => {
  try {
    const weekStart = parseInt(localStorage.getItem(KEY_WEEK_START) ?? "0");
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (now - weekStart > oneWeek) {
      localStorage.setItem(KEY_WEEK_START, String(now));
      localStorage.setItem(KEY_WEEK, "0");
      return 0;
    }
    return parseInt(localStorage.getItem(KEY_WEEK) ?? "0");
  } catch { return 0; }
};

export const incrementProcessed = () => {
  try {
    const total = parseInt(localStorage.getItem(KEY_TOTAL) ?? "0") + 1;
    const week  = parseInt(localStorage.getItem(KEY_WEEK)  ?? "0") + 1;
    localStorage.setItem(KEY_TOTAL, String(total));
    localStorage.setItem(KEY_WEEK,  String(week));
    if (!localStorage.getItem(KEY_WEEK_START)) {
      localStorage.setItem(KEY_WEEK_START, String(Date.now()));
    }
  } catch {}
};

const MILESTONES = [1, 5, 10, 25, 50, 100];

const CreatorStats = () => {
  const [total, setTotal] = useState(0);
  const [week, setWeek]   = useState(0);

  useEffect(() => {
    setTotal(parseInt(localStorage.getItem(KEY_TOTAL) ?? "0"));
    setWeek(getWeekStats());
    const id = setInterval(() => {
      setTotal(parseInt(localStorage.getItem(KEY_TOTAL) ?? "0"));
      setWeek(getWeekStats());
    }, 3000);
    return () => clearInterval(id);
  }, []);

  if (total === 0) return null;

  const nextMilestone = MILESTONES.find(m => m > total) ?? total + 50;
  const progress = Math.min(100, Math.round((total / nextMilestone) * 100));
  const recentWorkflows = workspaceMemory.getWorkflows().length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Your Creator Stats</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-black text-gray-900 dark:text-white">{total}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Total processed</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-orange-500 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4" />{week}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">This week</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-violet-600 dark:text-violet-400">{recentWorkflows}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Workflows used</p>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-400" /> Next milestone: {nextMilestone} videos</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CreatorStats;
