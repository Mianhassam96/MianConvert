import { motion } from "framer-motion";
import { CheckCircle, Circle, ChevronRight } from "lucide-react";

interface TimelineStep {
  id: string;
  icon: string;
  label: string;
  done: boolean;
  active?: boolean;
}

interface SessionTimelineProps {
  steps: TimelineStep[];
  onOpenTool?: (toolId: string) => void;
}

const SessionTimeline = ({ steps, onOpenTool }: SessionTimelineProps) => {
  const doneSteps = steps.filter(s => s.done);
  if (doneSteps.length === 0) return null;

  const nextStep = steps.find(s => !s.done);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Your session
        </p>
        {nextStep && (
          <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
            Next: {nextStep.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1 shrink-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => step.done && onOpenTool?.(step.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                step.done
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50"
                  : step.active
                  ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-2 border-violet-400 dark:border-violet-600"
                  : "bg-gray-50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {step.done
                ? <CheckCircle className="w-3 h-3 shrink-0" />
                : <Circle className="w-3 h-3 shrink-0" />
              }
              <span>{step.icon}</span>
              <span className="whitespace-nowrap">{step.label}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SessionTimeline;
