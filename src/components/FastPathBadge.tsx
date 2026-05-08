/**
 * FastPathBadge — shown during processing when fast stream copy is used.
 * Makes renders FEEL intelligent and fast.
 */
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface FastPathBadgeProps {
  message?: string;
}

const FastPathBadge = ({ message = "Using ultra-fast stream copy — no re-encoding needed" }: FastPathBadgeProps) => (
  <motion.div
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 text-xs text-green-700 dark:text-green-400 font-semibold"
  >
    <Zap className="w-3.5 h-3.5 shrink-0 text-green-500" />
    <span>⚡ {message}</span>
  </motion.div>
);

export default FastPathBadge;
