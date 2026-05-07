import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { workspaceMemory, WorkflowEntry } from "@/lib/workspace-memory";
import { Clock, ChevronRight } from "lucide-react";

interface RecentWorkflowsProps {
  onOpen: (toolId: string, preset?: string) => void;
}

const RecentWorkflows = ({ onOpen }: RecentWorkflowsProps) => {
  const [workflows, setWorkflows] = useState<WorkflowEntry[]>(() => workspaceMemory.getWorkflows());

  // Refresh when storage changes (e.g. after openTool saves a new workflow)
  useEffect(() => {
    const handler = () => setWorkflows(workspaceMemory.getWorkflows());
    window.addEventListener("storage", handler);
    // Also poll every 2s for same-tab updates (localStorage doesn't fire storage event in same tab)
    const id = setInterval(() => setWorkflows(workspaceMemory.getWorkflows()), 2000);
    return () => { window.removeEventListener("storage", handler); clearInterval(id); };
  }, []);

  if (!workflows.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> Recent workflows
      </p>
      <div className="flex flex-wrap gap-2">
        {workflows.map((w, i) => (
          <motion.button
            key={w.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpen(w.toolId, w.preset)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 group"
          >
            <span className="text-sm">{w.icon}</span>
            <span>{w.label}</span>
            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-violet-500 transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentWorkflows;
